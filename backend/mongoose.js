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

// set up mongoose models
const Corp = require('./Models/corpModel.js');
const corpKMSchema = require('./Models/killmailModel.js');

// set up express
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use('/stats', statsRouter);

app.listen(3001, function () {
    console.log('Node app is running on port 3001');
});

app.get('/', function (req, res) {
    return res.send('Wormboard API.');
});

// connect to localhost mongoose - change this later
mongoose.connect('mongodb://localhost:27017/MyDb', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

cron.schedule('* */15 * * *', () => {
    getRealTimeKMLoop();
    console.log('running a task every hours');
});

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

function insertRedisQKM() {
    var redisUrl = 'https://redisq.zkillboard.com/listen.php?queueID=ABCD1234';
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

async function updateCorpPopulation(year, month, corpId, newPopulation) {
    const filter = {
        _year: year,
        _month: month,
        _corpid: corpId
    };
    const update = {
        totalMember: newPopulation
    };

    try {
        const findUpdate = await corpKMSchema.findOneAndUpdate(filter, update).exec();
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

function getCorpInfo(corpId) {
    var url = 'https://esi.evetech.net/latest/corporations/' + corpId + '/?datasource=tranquility';
    var options = {
        method: 'GET',
        uri: url,
        json: true
    };

    if (corpId == 500021 || corpId == "500021") {
        // drifter id is 500021, if passed to corporation api it returns error so I am hardcoding the exception
        var drifterCorp = {};
        drifterCorp.name = "drifter"
        drifterCorp.ticker = "UNKWN"
        return drifterCorp;
    }

    return rp(options)
        .then(response => {
            return response;
        })
        .catch(err => {
            console.log('Error in fetching corp info for corp id ' + corpId);
            return err;
        });
}

async function corpExistInDB(corpId) {
    try {
        const searchCorpId = await Corp.findOne({ corpid: corpId }).exec();
        //console.log("searchCorpId is : " + '' + await Corp.findOne({ corpid: corpId }).exec());
        return (searchCorpId != null)
    } catch (err) {
        console.log(err);
    };
}

async function addNewCorp(killID, corpId, name, ticker) {
    const newCorp = new Corp({
        corpid: corpId,
        corpName: name,
        corpTicker: ticker
    });

    try {
        let saveUser = await newCorp.save();
    } catch (err) {
        console.log(killID);
        console.log(err);
    }
}

async function processRealTimeBatch(listOfKMs) {
    // all KMs in listOfKMs are wormhole KMs
    await listOfKMs.forEach(async (km) => {
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

        // this following logic is used to account active PVP (Might make sense to refactor this into addKillToCorpStats() ???)
        attackers.forEach(attacker => {
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
        });

        await addKillToCorpStats(killID, corpMapPilots, killValue, killPoints, date).catch(error => console.error(error.stack));

        await addVictimToCorpStats(killID, victim, killValue, killPoints, date).catch(error => console.error(error.stack));
    });
}

async function addKillToCorpStats(killID, corpMapPilots, killValue, killPoints, date) {
    for (const [corpId, killList] of corpMapPilots.entries()) {
        const filter = {
            _year: date.getUTCFullYear(),
            _month: date.getUTCMonth() + 1,
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
            upsert: true
        }

        try {
            //console.log("corp id of "+ corpId);
            const findUpdate = await corpKMSchema.findOneAndUpdate(filter, update, options).exec();
            if (findUpdate == null) {
                // might be new month OR corp not in system, gonna figure it out!
                const corpExistInDatabase = await corpExistInDB(corpId);
                if (!corpExistInDatabase) {
                    // corp not in system, we need to ask ccp for info given corpId
                    const newCorpInfo = await getCorpInfo(corpId);
                    await addNewCorp(killID, corpId, newCorpInfo.name, newCorpInfo.ticker);
                    await updateCorpPopulation(date.getUTCFullYear(), date.getUTCMonth() + 1, corpId, newCorpInfo.member_count);
                }
            }
        } catch (err) {
            console.log(err);
            console.error('Error in finding corp to insert kill km into!');
        };
    }
}

async function addVictimToCorpStats(killID, victim, killValue, killPoints, date) {
    const corpId = victim.corporation_id;
    const filter = {
        _year: date.getUTCFullYear(),
        _month: date.getUTCMonth() + 1,
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
        upsert: true
    };

    try {
        //("corp id of " + corpId);
        const findUpdate = await corpKMSchema.findOneAndUpdate(filter, update, options).exec();
        if (findUpdate == null) {
            // might be new month OR corp not in system, gonna figure it out!
            const corpExistInDatabase = await corpExistInDB(corpId);
            if (!corpExistInDatabase) {
                // corp not in system, we need to ask ccp for info given corpId
                const newCorpInfo = await getCorpInfo(corpId);
                await addNewCorp(killID, corpId, newCorpInfo.name, newCorpInfo.ticker);
                await updateCorpPopulation(date.getUTCFullYear(), date.getUTCMonth() + 1, corpId, newCorpInfo.member_count);
            }
        }
    } catch (err) {
        console.log(err);
        console.error('Error in finding corp to insert victim km into!');
    };
}

module.exports = { addKillToCorpStats, addVictimToCorpStats, addNewCorp, corpExistInDB, getCorpInfo, updateCorpPopulation };