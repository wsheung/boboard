const mongoose = require('mongoose');
const cron = require('node-cron'); // so we can schedule cron jobs to run realtime km feed
const util = require('util'); // for recursive print
var _ = require('lodash');

import {
    asyncForEach,
    sleep,
    firstDayPreviousMonth
} from './Utility/util';

import {
    getKillMailCCP,
    getCorpInfo,
    getFactionInfo,
    getAllianceInfo
} from './API/esi';

import {
    findAndInsertNewMonth,
    setCorpStatsComplete,
    corpIsNPC,
    corpProcessedKM,
    updateCorpInfo,
    corpExistInDB
} from './API/mongodb';

import { getHistoricalForCorp, fetchKMFromRedisQ } from './API/zkb';

// import routes to our REST endpoint, later used by express
const statsRouter = require('./REST/stats_route');

// set up mongoose models
const CorpStat = require('./Models/killmailModel.js');

// read from config file
const configs = require('./configs.json');

// set up express
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use('/stats', statsRouter);

app.listen(configs.nodeServerPort, function () {
    console.log('Node app is running on port ' + configs.nodeServerPort);
});

app.get('/', function (req, res) {
    return res.send('Welcome to Wormboard API!');
});

// connect to localhost mongoose
mongoose.connect('mongodb://localhost:27017/MyDb', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });


// Global variables for now
var historicalQueue = [];
var startTime, endTime;

function start() {
	startTime = new Date();
}

function end() {
	endTime = new Date();
	var diff = endTime - startTime; // in ms
	diff /= 1000; // rid of ms
	var seconds = Math.round(diff);
	var minutes = diff / 60;
	console.log("last batch finished in : " + minutes);
	if (minutes > 180) {
		console.log("Took too long to process batch, might missed a few kms");
	}
}

// cron job for real time km feed
var realTimeTask = cron.schedule('*/5 * * * *', async () => {
        console.log('running a fetch task every 5 minutes');
        await getRealTimeKM();
});

getRealTimeKM();

async function getRealTimeKM() {
    console.log("start realtime fetching");
    realTimeTask.stop();
    start();
    var kmBatch = []; // process km batch by batch

    var km = await fetchKMFromRedisQ();

    while (km.package != null && kmBatch.length < 50) { // throttle it by increments of 50 WH km each time
        if (km.package.killmail.solar_system_id.toString().startsWith("3100")) {
            //wormhole systemid starts with 3100XXXX
            console.log("added one new km");
            kmBatch.push(km);
        }
        km = await fetchKMFromRedisQ();
    }
    // if we managed to any KM from in this round, we pass it to processing

    if (kmBatch.length > 0) {
        console.log("processing km batch of length : "+ kmBatch.length);
        await processRealTimeBatch(kmBatch, true); // we use recursive case since this is the realtimefetch
        // reset kmBatch after process, not really necessary but nice to have
        kmBatch = [];
        await processGlobalHistoricalQueue();
    }
    realTimeTask.start();
    end();
}

async function processGlobalHistoricalQueue() {
    console.log("starting to process historical killmails");
    console.log("size is : " + historicalQueue);
    historicalQueue = _.union(historicalQueue, historicalQueue); // removing duplicates in case of any
    console.log("new size is : " + historicalQueue);
    while (historicalQueue.length > 0) {
	// if there are still remaining stiff in queue
        var currentTime = new Date(); // get current time
        var secondSinceStart = (currentTime - startTime) / 1000;
	if ((secondSinceStart / 60) < 100) {
        	const corpid = historicalQueue[0];
        	await getHistoricalData(corpid);
        	historicalQueue.shift();
        	console.log("we are still under 100 minute mark, keep processing historical km");
	} else {
		console.log("took too long fetching historical queue, switching back to realtime to avoid missing new kms");
		break;
	}
    }
}


async function fetchMonthKMForCorp(corpid, month, year) {
    var page = 1; // default page is 1
    var kmBatch = []; // batch of kill mail ids fetched from ESI
    var packageBatch = []; // batch of full killmail merged from ESI and ZKB data

    var retryNum = 3;
    
    // we don't know how many pages there is, so we try until we hit an empty array response
    do {
        // start by getting the list of kms for a given corp in a given month
        var killsInMonthForCorp = await getHistoricalForCorp(year, month, corpid, page);
        while (killsInMonthForCorp == null && retryNum > 0) {
            await sleep(3000);
            killsInMonthForCorp = await getHistoricalForCorp(year, month, corpid, page);
            retryNum--;
        }
        if (killsInMonthForCorp != null) {
            // concat result to temp batch array
            kmBatch = kmBatch.concat(killsInMonthForCorp);
            page++;
            await sleep(1000); // trying to not hammer the poor zkb api
        } else {
            // something is wrong why KM batch is returning err
            return null;
        }
    } while (killsInMonthForCorp.length != 0);

    const listCorpProcessedKM = await findAndInsertNewMonth(year, month, corpid);

    if (listCorpProcessedKM) {
        console.log("pre difference : " + kmBatch.length);
        // do a quick left join to remove already accounted KMs in the historical batch
        kmBatch = _.difference(kmBatch, listCorpProcessedKM.processedKMID);
        console.log("post difference : " + kmBatch.length);
    }

    // we've fetched all kills for given corpid in month, now fetch the full
    // killmail from CCP ESI and then assemble them in the same way redisQ returns them
    for (var kmIndex = 0; kmIndex < kmBatch.length; kmIndex++) {
        const kId = kmBatch[kmIndex].killmail_id;
        const kHash = kmBatch[kmIndex].zkb.hash;
        // reach out to ESI for full KM if its not awox
	if (kmBatch[kmIndex].zkb.awox == false) {
	        const fullKM = await getKillMailCCP(kId, kHash);
	        // we need to construct the "package" object the same way redisQ returns them to re-use realtime code
	        kmBatch[kmIndex].killmail = fullKM;
	        kmBatch[kmIndex].killID = kId;
	        const mimicRedisObject = {};
	        mimicRedisObject.package = kmBatch[kmIndex];
	        packageBatch.push(mimicRedisObject);
	}
    }
    // return the batch for processing
    return packageBatch;
}

async function getHistoricalData(corpid) {
    var date = new Date();

    // we want to get the past 6 months for now
    for (var i = 0; i < 6; i++) {
        var year = date.getUTCFullYear();
        var month = date.getUTCMonth() + 1;

        // check if the month has finished processing before
        const corpDocument = await findAndInsertNewMonth(year, month, corpid);
        const isCorpNPC = await corpIsNPC(year, month, corpid);

        // if not processed before, start fetching
        if (!corpDocument.completed && !isCorpNPC) {
            var packageBatch = await fetchMonthKMForCorp(corpid, month, year);
            if (packageBatch == null) {
                console.log("historicalQ is incremented but something is wrong, here is the corpid : " + corpid);
                historicalQueue.push(corpid); // push it back to the end of queue and maybe it will sort itself out later
                break; // beak out of loop in case something is wrong with the package batch
            }

            // we push it to the right function to process it, don't do recursive since thats only for testing
            await processRealTimeBatch(packageBatch, false);
        }

        // make sure to set completed to true in mongodb to make sure we don't check it again next time
        setCorpStatsComplete(year, month, corpid);
        date = firstDayPreviousMonth(date); // move back one month
    }
}

async function processRealTimeBatch(listOfKMs, recursiveOn) {
    console.log("in processrealtimebatch historicalq length is : "+ historicalQueue);
    // all KMs in listOfKMs are wormhole KMs
    await asyncForEach(listOfKMs, async (km) => {
        const killmail = km.package.killmail;
        const zkb = km.package.zkb;
        const attackers = killmail.attackers; // array of attackers
        const victim = killmail.victim; // victim object
        const killmailTime = killmail.killmail_time;
        const killID = km.package.killID;
        const killValue = zkb.totalValue;
        const killPoints = zkb.points;

        // convert date format to know where to put km
        var date = new Date(killmailTime);

        var corpMapPilots = new Map();

        if (attackers != null) {
            // this following logic is used to account active PVP (Might make sense to refactor this into addKillToCorpStats() ???)
            attackers.forEach(attacker => {
                if ("corporation_id" in attacker) {
                    if (!corpMapPilots.has(attacker.corporation_id)) {
                        // if corp isn't accounted for yet, we push array in as value
                        var killer = [];
                        if ("character_id" in attacker) {
                            killer.push(attacker.character_id);
                            if (!attacker.corporation_id.toString().startsWith('1000')) {
                                // append corp id for historical fetching needs later
                                if (recursiveOn) {
                                    console.log("we pushed new realtimefetch corp into queue : " + attacker.corporation_id);
                                    historicalQueue.push(attacker.corporation_id);
                                }
                            }
                        } else {
                            // char_id doesn't exist, then it must be an NPC/ NPC structure that killed
                            if (attacker.corporation_id.toString().startsWith('1000')) {
                                killer.push(attacker.ship_type_id);
                            } else {
                                // this should never happen
                                //console.log("something bad happened, we found a killmail that doesn't have corpid and character id and its not an npc here it is : " + killID);
				killer.push(attacker.corporation_id);
                            }
                        }
                        corpMapPilots.set(attacker.corporation_id, killer);
                    } else {
                        // if corp exist on previous processed attackers, we append the pilot id
                        var newKillerList;
                        if ("character_id" in attacker) {
                            newKillerList = corpMapPilots.get(attacker.corporation_id).concat(attacker.character_id);
                        } else {
                            if (attacker.corporation_id.toString().startsWith('1000')) {
                                newKillerList = corpMapPilots.get(attacker.corporation_id).concat(attacker.ship_type_id);
                            } else {
                                // this should never happen
				//console.log("something bad happened, we found a km that exist on previous processed attackers but don't have character id and its not npc");
                                newKillerList = corpMapPilots.get(attacker.corporation_id).concat(attacker.corporation_id);
				}
                        }
                        corpMapPilots.set(attacker.corporation_id, newKillerList);
                    }
                } else if (attacker.faction_id != null) {
                    if (!corpMapPilots.has(attacker.faction_id)) {
                        // if faction isn't accounted for yet, we push array in as value
                        var killer = [];
                        killer.push(attacker.ship_type_id);
                        corpMapPilots.set(attacker.faction_id, killer);
                    }
                } else {
                    console.log("something about this km is wrong here it is");
                    console.log(util.inspect(km, { showHidden: false, depth: null }));
                }
            });

            await addKillToCorpStats(killID, corpMapPilots, killValue, killPoints, date).catch(error => console.error(error.stack));
        }
        await addVictimToCorpStats(killID, victim, killValue, killPoints, date, recursiveOn).catch(error => console.error(error.stack));
    });
}

async function addKillToCorpStats(killID, corpMapPilots, killValue, killPoints, date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    for (const [corpId, killList] of corpMapPilots.entries()) {
        const listCorpProcessedKM = await corpProcessedKM(year, month, corpId);
        if ((listCorpProcessedKM != null && !listCorpProcessedKM.includes(killID)) || listCorpProcessedKM == null) {
            const filter = {
                _year: year,
                _month: month,
                _corpid: corpId
            };
            const update = {
    		lastUpdate: new Date(),
                $inc: {
                    killCount: 1,
                    iskKilled: killValue,
                    netPoints: killPoints
                },
                $addToSet: {
                    activePVP: { $each: killList },
                    processedKMID: killID
                }
            }
            const options = {
                upsert: true,
            }

            try {
                const findUpdate = await CorpStat.findOneAndUpdate(filter, update, options).exec();
                if (findUpdate == null) {
                    // First time inserting the corp since it returned null (original state)!
                    // this mean we need to update db with the correct corp name, corp ticker, and total member
                    if (corpId.toString().startsWith("5000")) {
                        // npc corp id is starts with 5000, if passed to corporation api it returns error so we are passing it to getfactioninfo
                        var factionCorp = await getFactionInfo(corpId);
                        var factionName = factionCorp.name;
                        var acronym = factionName.match(/\b(\w)/g).join('');
                        await updateCorpInfo(year, month, corpId, factionCorp.name, acronym, null, null, null, 1, true); // NPC corp effectively have one member
                    } else if (corpId.toString().startsWith("1000")) {
                        const playerCorp = await getCorpInfo(corpId);
                        await updateCorpInfo(year, month, corpId, playerCorp.name, playerCorp.ticker, null, null, null, playerCorp.member_count, true);
                    } else {
                        const playerCorp = await getCorpInfo(corpId);
                        if ("alliance_id" in playerCorp) {
                            const playerAlliance = await getAllianceInfo(playerCorp.alliance_id);
                            await updateCorpInfo(year, month, corpId, playerCorp.name, playerCorp.ticker, playerCorp.alliance_id, playerAlliance.name, playerAlliance.ticker, playerCorp.member_count, false);
                        } else {
                            await updateCorpInfo(year, month, corpId, playerCorp.name, playerCorp.ticker, null, null, null, playerCorp.member_count, false);
                        }
                    }
                }
            } catch (err) {
                if (err.code == 11000) {
                    console.log("error occurred at insert km can't find corp to insert km into");
                    try {
                        await CorpStat.findOneAndUpdate(filter, update, options).exec();
                    } catch (err) {
                        console.log(err);
                        console.error('Error in finding corp to insert kill km into!');
                    }
                }
            };
        }
    }
    // after handling new kms we start fetching historical stuff
}

async function addVictimToCorpStats(killID, victim, killValue, killPoints, date, recursiveOn) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const corpId = victim.corporation_id;
    const listCorpProcessedKM = await corpProcessedKM(year, month, corpId);
    if (listCorpProcessedKM == null || listCorpProcessedKM != null && !listCorpProcessedKM.includes(killID)) {
        const filter = {
            _year: year,
            _month: month,
            _corpid: corpId
        };
        const update = {
	    lastUpdate: new Date(),
            $inc: {
                lossCount: 1,
                iskLossed: killValue,
                netPoints: -killPoints
            },
            $addToSet: {
                activePVP: victim.character_id,
                processedKMID: killID
            },
        };

        const options = {
            upsert: true,
        };

        try {
            const findUpdate = await CorpStat.findOneAndUpdate(filter, update, options).exec();
            if (findUpdate == null) {
                // First time inserting the corp since it returned null (original state)!
                // this mean we need to update db with the correct corp name, corp ticker, and total member
                // corp not in system, we need to ask ccp for info given corpId
                if (corpId.toString().startsWith("1000")) {
                    const playerCorp = await getCorpInfo(corpId);
                    await updateCorpInfo(year, month, corpId, playerCorp.name, playerCorp.ticker,null, null, null, playerCorp.member_count, true);
                } else {
                    const playerCorp = await getCorpInfo(corpId);
                    if ("alliance_id" in playerCorp) {
                        const playerAlliance = await getAllianceInfo(playerCorp.alliance_id);
                        await updateCorpInfo(year, month, corpId, playerCorp.name, playerCorp.ticker, playerCorp.alliance_id, playerAlliance.name, playerAlliance.ticker, playerCorp.member_count, false);
                    } else {
                        await updateCorpInfo(year, month, corpId, playerCorp.name, playerCorp.ticker, null, null, null, playerCorp.member_count, false);
                    }
                    // append victim corp id for historical fetching needs later
                    if (recursiveOn) {
                        console.log("we pushed new realtimefetch corp into queue : " + corpId);
                        historicalQueue.push(corpId);
                    }
                }
            }
	    if (findUpdate != null && !findUpdate.completed && !findUpdate.isNPC) {
	    	if (recursiveOn) {
			console.log("we pushed corp that exist from other km processing into queue : " + corpId);
			historicalQueue.push(corpId);
		}
	    }
        } catch (err) {
                console.log(err);
                console.error('Error in finding corp to insert victim km into!');
        };
    }
}

module.exports = { addKillToCorpStats, addVictimToCorpStats, corpExistInDB, getCorpInfo, updateCorpInfo }; // so we can use them in testing
