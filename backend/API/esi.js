var rp = require('request-promise');
import { sleep } from '../Utility/util';

export async function getKillMailCCP(killId, killHash) {
    var url = 'https://esi.evetech.net/latest/killmails/' + killId + '/' + killHash + '/?datasource=tranquility';
    var options = {
        method: 'GET',
        uri: url,
        json: true
    };
    var fetchKMSuccess = false;
    var solution;
    while (!fetchKMSuccess) {
        solution = await rp(options)
        .then(response => {
            fetchKMSuccess = true;
            return response;
        })
        .catch(async err => {
            console.log('Error in fetching CCP ESI endpoint for Killmail ' + killId + "with hash : " + killHash);
            await sleep(500);
            //console.log(err);
        });
    }
    return solution;
}

export async function getCorpInfo(corpId) {
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
            //console.log(err);
            //return err;
        });
}

export async function getAllianceInfo(allianceId) {
    var url = 'https://esi.evetech.net/latest/alliances/' + allianceId + '/?datasource=tranquility';
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
            console.log('Error in fetching alliance info for alliance id ' + allianceId);
            //console.log(err);
            //return err;
        });
}

export async function getFactionInfo(factionId) {
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
                if (faction.faction_id === factionId) {
                    result = faction;
                }
            })
            return result;
        })
        .catch(err => {
            console.log('Error in fetching faction info for factionid ' + factionId);
            //console.log(err);
            //return err;
        });
}