const mongoose = require('mongoose');
var request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const app = express();
var rp = require('request-promise');
var _ = require('lodash');
const statsRouter = require('./api/stats_route');
const corpsRouter = require('./api/corps_route');
const util = require('util')

// set up mongoose models
const Corp = require('./Models/corpModel.js');
const CorpStat = require('./Models/killmailModel.js');

// set up express
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use('/stats', statsRouter);
app.use('/corps', corpsRouter);

app.listen(3001, function () {
    console.log('Node app is running on port 3001');
});

app.get('/', function (req, res) {
    return res.send('Wormboard API.');
});

// connect to localhost mongoose - change this later
mongoose.connect('mongodb://localhost:27017/MyDb', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

cron.schedule('*/30 * * * *', () => {
    getRealTimeKMLoop();
    console.log('running a task every 30 mins');
});

getHistoricalData();

// URLs for requests
var redisUrl = 'https://redisq.zkillboard.com/listen.php?queueID=ABCD1234';

async function getRealTimeKMLoop() {
    var kmBatch = []; // process km batch by batch

    var km = await insertRedisQKM();

    while (km.package != null) {
        if (km.package.killmail.solar_system_id.toString().startsWith("3100")) {
            //wormhole systemid starts with 3100XXXX
            kmBatch.push(km);
        }
        km = await insertRedisQKM();
        //console.log(kmBatch.length);
    }

    if (kmBatch.length > 0) {
        await processRealTimeBatch(kmBatch);
        // reset kmBatch after process
        kmBatch = [];
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function firstDayPreviousMonth(originalDate) {
    // this is freaking brilliant
    var d = new Date(originalDate);
    d.setDate(0); // set to last day of previous month
    d.setDate(1); // set to the first day of that month
    return d;
}

async function getHistoricalData() {
    var date = new Date();

    // fetch the top 500 corps of this month by points
    var listOfCorp = await getTopCorpToFetchHistory(date.getUTCFullYear(), date.getUTCMonth() + 1);

    listOfCorp = listOfCorp.filter(corpId => {
        if (corpId.toString().startsWith("1000") || corpId.toString().startsWith("5000")) {
            return false;
        }
        return true;
    })

    console.log(listOfCorp);

    for (var i = 0; i < 5; i++) {
        date = firstDayPreviousMonth(date); // essentially doing date = date - 1
        var thisYear = date.getUTCFullYear();
        var thisMonth = date.getUTCMonth() + 1;
        for (var corpIndex = 0; corpIndex < listOfCorp.length; corpIndex++) {
            // using await in foreach is annoying so I used for loop
            const corpid = listOfCorp[corpIndex];
            console.log("working on corpid : " + corpid);
            var page = 1; // default page is 1
            var kmBatch = [];
            var packageBatch = [];

            var killsInMonthForCorp = await getHistoricalForCorp(thisYear, thisMonth, corpid, page);
            console.log(thisYear);
            console.log(thisMonth);
            console.log(killsInMonthForCorp);
            kmBatch = kmBatch.concat(killsInMonthForCorp);
            while (killsInMonthForCorp.length != 0) {
                await sleep(5000);
                console.log('more is found');
                page++;
                // we don't have anything else 
                killsInMonthForCorp = await getHistoricalForCorp(thisYear, thisMonth, corpid, page);
                kmBatch = kmBatch.concat(killsInMonthForCorp);
            }
            console.log(kmBatch);
            console.log("^^ km batch");
            await sleep(5000);

            console.log("finished fetching kills from zkb, now need to add full km for corp : " + corpid);

            // we've fetched all kills for corp in month, now fetch the full
            // killmail from CCP ESI and then assemble them in the same way redis fetch works
            console.log("kmBatch.length : " + kmBatch.length);
            for (var kmIndex = 0; kmIndex < kmBatch.length; kmIndex++) {
                const kId = kmBatch[kmIndex].killmail_id;
                const kHash = kmBatch[kmIndex].zkb.hash;
                console.log("reaching out to ccp for full km");
                const fullKM = await getKillMailCCP(kId, kHash);
                console.log("done one full km");
                kmBatch[kmIndex].killmail = fullKM;
                const mimicRedisObject = {};
                mimicRedisObject.package = kmBatch[kmIndex];
                packageBatch.push(mimicRedisObject);
            }

            console.log("processed one batch of corpID" + corpid);

            // we push it to the right function to process it
            await processRealTimeBatch(packageBatch);
        }
    }
}

async function getTopCorpToFetchHistory(year, month) {
    try {
        // not npc, top 500 in points ranking, in time range provided, distinct to avoid double counting
        const result = await CorpStat.find({ _year: year, _month: month }).sort({ netPoints: -1 }).limit(500).distinct('_corpid').exec();
        return result;
    } catch (err) {
        console.log(err);
    }
}

async function getKillMailCCP(killId, killHash) {
    var url = 'https://esi.evetech.net/latest/killmails/' + killId + '/' + killHash + '/?datasource=tranquility';
    var options = {
        method: 'GET',
        uri: url,
        json: true
    };

    return rp(options)
        .then(response => {
            return response;
        })
        .catch(err => {
            console.log('Error in fetching CCP ESI endpoint for Killmail ' + killId + "with hash : " + killHash);
            return err;
        });
}

function getHistoricalForCorp(year, month, corpID, page) {
    var url = 'https://zkillboard.com/api/w-space/corporationID/'+ corpID +'/year/'+ year +'/month/'+ month +'/page/' + page + '/';
    var options = {
        method: 'GET',
        uri: url,
        json: true
    };

    return rp(options)
        .then(response => {
            return response;
        })
        .catch(err => {
            console.log('Error in fetching historical info for corp id ' + corpID + " in month year : " + month + "/"+ year );
            return err;
        });
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

function insertRedisQKM() {
    var redisUrl = 'https://redisq.zkillboard.com/listen.php?queueID=eol';
    var options = {
        method: 'GET',
        uri: redisUrl,
        json: true,
    };
    //console.log("insert redis q is called");
    
    return rp(options)
        .then((response) => {
            return response;
        })
        .catch((err) => {
            console.log('Error in fetching redisQ!');
            return err;
        });
}

async function updateCorpInfo(year, month, corpId, name, ticker, newPopulation, isNPC) {
    const filter = {
        _year: year,
        _month: month,
        _corpid: corpId
    };
    const update = {
        totalMember: newPopulation,
        _corpName: name,
        _corpTicker: ticker,
        isNPC: isNPC
    };

    try {
        const findUpdate = await CorpStat.findOneAndUpdate(filter, update).exec();
        if (findUpdate == null) {
            console.log("update corp population corpid is not found : " + corpId);
        //     // this should never happen since the only time we call update population is in the
        //     // callback of findOneAndUpdate in upsert mode

        //     // Ask god why this exist - 
        //     const corpExistInDatabase = await corpExistInDB(corpId);
        //     if (!corpExistInDatabase) {
        //         // corp not in system, we need to ask ccp for info given corpId
        //         const newCorpInfo = await getCorpInfo(corpId);
        //         await addNewCorp(corpId, newCorpInfo.name, newCorpInfo.ticker);
        //     }
        // }
        }
    } catch (err) {
        console.log(err);
        console.error('Error in finding corp to update population!');
    };

    
}
function getFactionInfo(factionId) {
    var url = 'https://esi.evetech.net/latest/universe/factions/?datasource=tranquility&language=en-us';
    var options = {
        method: 'GET',
        uri: url,
        json: true
    }

    return rp(options)
        .then(response => {
            var result;
            response.forEach(faction => {
                console.log(faction.faction_id === factionId);
                if (faction.faction_id === factionId) {
                    result = faction;
                }
            })
            return result;
            //console.log("did not find a match for factionid" + factionId);
        })
        .catch(err => {
            console.log('Error in fetching faction info for factionid ' + factionId);
            return err;
        });
}

function getCorpInfo(corpId) {
    var url = 'https://esi.evetech.net/latest/corporations/' + corpId + '/?datasource=tranquility';
    var options = {
        method: 'GET',
        uri: url,
        json: true
    };

    return rp(options)
        .then(response => {
            return response;
        })
        .catch(err => {
            console.log('Error in fetching corp info for corp id ' + corpId);
            return err;
        });
}

async function corpExistInDB(year, month, corpId) {
    try {
        const searchCorpId = await CorpStat.count({ _year: year, _month: month, corpid: corpId }).exec();
        //console.log("searchCorpId is : " + '' + await Corp.findOne({ corpid: corpId }).exec());
        return (searchCorpId > 0)
    } catch (err) {
        console.log(err);
    };
}

async function processRealTimeBatch(listOfKMs) {
    // all KMs in listOfKMs are wormhole KMs
    asyncForEach(listOfKMs, async (km) => {
        //console.log(util.inspect(km, { showHidden: false, depth: null }));
        const killmail = km.package.killmail;
        const zkb = km.package.zkb;

        const attackers = killmail.attackers; // array of attackers
        const victim = killmail.victim; // victim object
        const killmailTime = killmail.killmail_time;
        const killID = km.package.killID;
        const killValue = zkb.totalValue;
        const killPoints = zkb.points;
        //console.log("processing kill ID" + killID);

        // convert date format to know where to put km
        var date = new Date(killmailTime);

        var corpMapPilots = new Map();

        if (attackers != null) {

            // this following logic is used to account active PVP (Might make sense to refactor this into addKillToCorpStats() ???)
            attackers.forEach(attacker => {
                if (attacker.corporation_id != null) {
                    if (!corpMapPilots.has(attacker.corporation_id)) {
                        // if corp isn't accounted for yet, we push array in as value
                        var killer = [];
                        killer.push(attacker.character_id);
                        corpMapPilots.set(attacker.corporation_id, killer);
                    } else {
                        // if corp exist on previous processed attackers, we append the pilot id
                        //console.log(corpMapPilots.get(attacker.corporation_id));
                        var newKillerList = corpMapPilots.get(attacker.corporation_id).concat(attacker.character_id);
                        corpMapPilots.set(attacker.corporation_id, newKillerList);
                    }
                } else if (attacker.faction_id != null) {
                    if (!corpMapPilots.has(attacker.faction_id)) {
                        // if faction isn't accounted for yet, we push array in as value
                        var killer = [];
                        killer.push(attacker.faction_id);
                        corpMapPilots.set(attacker.faction_id, killer);
                    }
                } else {
                    console.log("something about this km is wrong here it is");
                    console.log(util.inspect(km, { showHidden: false, depth: null }));
                }
            });

            await addKillToCorpStats(killID, corpMapPilots, killValue, killPoints, date).catch(error => console.error(error.stack));
        }

        await addVictimToCorpStats(killID, victim, killValue, killPoints, date).catch(error => console.error(error.stack));
    });
}

async function addKillToCorpStats(killID, corpMapPilots, killValue, killPoints, date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    for (const [corpId, killList] of corpMapPilots.entries()) {
        const filter = {
            _year: year,
            _month: month,
            _corpid: corpId
        };
        const update = {
            $inc: {
                killCount: 1,
                iskKilled: killValue,
                netPoints: killPoints
            },
            $addToSet: { activePVP: { $each: killList } }
        }
        const options = {
            upsert: true,
        }

        try {
            //console.log("corp id of "+ corpId);
            const findUpdate = await CorpStat.findOneAndUpdate(filter, update, options).exec();
            if (findUpdate == null) {
                // First time inserting the corp since it returned null (original state)!
                // this mean we need to update db with the correct corp name, corp ticker, and total member
                if (corpId.toString().startsWith("5000")) {
                    // npc corp id is starts with 5000, if passed to corporation api it returns error so we are passing it to getfactioninfo
                    var factionCorp = await getFactionInfo(corpId);
                    var factionName = factionCorp.name;
                    var acronym = factionName.match(/\b(\w)/g).join('');
                    await updateCorpInfo(year, month, corpId, factionCorp.name, acronym, 1, true); // NPC corp effectively have one member
                } else {
                    const playerCorp = await getCorpInfo(corpId);
                    await updateCorpInfo(year, month, corpId, playerCorp.name, playerCorp.ticker, playerCorp.member_count, false);
                }
            }
        } catch (err) {
            if (err.code == 11000) {
                console.log("error occurred at insert km can't find corp to insert km into");
                try {
                    const findUpdate = await CorpStat.findOneAndUpdate(filter, update, options).exec();
                } catch (err) {
                    console.log(err);
                    console.error('Error in finding corp to insert kill km into!');
                }
            }
        };
    }
}

async function addVictimToCorpStats(killID, victim, killValue, killPoints, date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const corpId = victim.corporation_id;
    const filter = {
        _year: year,
        _month: month,
        _corpid: corpId
    };
    const update = {
        $inc: {
            lossCount: 1,
            iskLossed: killValue,
            netPoints: -killPoints
        },
        $addToSet: { activePVP: victim.character_id }
    };

    const options = {
        upsert: true,
    };

    try {
        //("corp id of " + corpId);
        const findUpdate = await CorpStat.findOneAndUpdate(filter, update, options).exec();
        if (findUpdate == null) {
            // First time inserting the corp since it returned null (original state)!
            // this mean we need to update db with the correct corp name, corp ticker, and total member
            // corp not in system, we need to ask ccp for info given corpId
            const playerCorp = await getCorpInfo(corpId);
            await updateCorpInfo(year, month, corpId, playerCorp.name, playerCorp.ticker, playerCorp.member_count, false);
        }
    } catch (err) {
            console.log(err);
            console.error('Error in finding corp to insert victim km into!');
    };
}

module.exports = { addKillToCorpStats, addVictimToCorpStats, corpExistInDB, getCorpInfo, updateCorpInfo }; // so we can use them in testing