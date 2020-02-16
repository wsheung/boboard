// set up mongoose models
const CorpStat = require('../Models/killmailModel.js');

import {
    getCorpInfo,
    getAllianceInfo
} from './esi';

export async function findAndInsertNewMonth(year, month, corpId) {
    var filter = {
        _year: year,
        _month: month,
        _corpid: corpId
    };
    var update = {
        completed: false,
	lastUpdate: new Date()
    };
    var options = {
        new: true,
        upsert: true,
    };

    try {
        // first check if there was existing document, in case we quited mid processing
        // or we are validating months pulled by realtime data with potential breaks/ started late
        const documentExist = await CorpStat.findOne(filter).exec();

        if (documentExist) {
            // since findOne returns NULL if it can't find, we now know the document exist
            return documentExist;
        } else {
            // document doesn't exist, we will need to move to upsert solution with CCP data
            console.log("document don't exist, we need to insert new one");
            const playerCorp = await getCorpInfo(corpId); // fetch corp info from CCP ESI
            if ("alliance_id" in playerCorp) {
            const playerAlliance = await getAllianceInfo(playerCorp.alliance_id);
                update.allianceid = playerCorp.alliance_id;
                update.allianceTicker = playerAlliance.ticker;
                update.alliance = playerAlliance.name;
            }
            
            update._corpName = playerCorp.name;
            update._corpTicker = playerCorp.ticker;
            update.totalMember = playerCorp.member_count;
            update.isNPC = false; // we don't ever fetch NPC accounts (eg. 1000xxx or 5000xxx) so its always false here

            const newCorpDocument = await CorpStat.findOneAndUpdate(filter, update, options).exec();
            return newCorpDocument;
        }
    } catch (err) {
        console.log(err);
    }

}

export async function corpProcessedKM(year, month, corpId) {
    try {
        const result = await CorpStat.findOne({ _year: year, _month: month, _corpid: corpId }).exec();
        if (result == null) {
            return result;
        }
        return result.processedKMID;
    } catch (err) {
        console.log(err);
    }
}

export async function corpIsNPC(year, month, corpId) {
    try {
        const result = await CorpStat.findOne({ _year: year, _month: month, _corpid: corpId }).exec();
        return result.isNPC;
    } catch (err) {
        console.log(err);
    }

}

export async function setCorpStatsComplete(year, month, corpId) {
    const filter = {
        _year: year,
        _month: month,
        _corpid: corpId
    };
    const update = {
        completed: true,
	lastUpdate: new Date()
    };

    try {
        await CorpStat.findOneAndUpdate(filter, update).exec();
    } catch (err) {
        console.log(err);
    }

}

export async function getTopCorpToFetchHistory(year, month) {
    try {
        // not npc, top 500 in points ranking, in time range provided, distinct to avoid double counting
        const result = await CorpStat.find({ _year: year, _month: month }).sort({ netPoints: -1 }).limit(500).distinct('_corpid').exec();
        return result;
    } catch (err) {
        console.log(err);
    }
}

export async function updateCorpInfo(year, month, corpId, corpName, corpTicker, allianceId, allianceName, allianceTicker, newPopulation, isNPC) {
    const filter = {
        _year: year,
        _month: month,
        _corpid: corpId
    };
    const update = {
        totalMember: newPopulation,
        _corpName: corpName,
        _corpTicker: corpTicker,
        allianceid: allianceId,
        allianceTicker: allianceTicker,
        alliance: allianceName,
        isNPC: isNPC,
	lastUpdate: new Date()
    };
    const options = {
        upsert: true,
    }

    try {
        const findUpdate = await CorpStat.findOneAndUpdate(filter, update, options).exec();
        if (findUpdate == null) {
            console.log("update corp population corpid is not found : " + corpId);
        }
    } catch (err) {
        console.log(err);
        console.error('Error in finding corp to update population!');
    };
}


export async function corpExistInDB(year, month, corpId) {
    try {
        const searchCorpId = await CorpStat.findOne({ _year: year, _month: month, corpid: corpId }).exec();
        console.log(searchCorpId);
        return (searchCorpId > 0)
    } catch (err) {
        console.log(err);
    };
}
