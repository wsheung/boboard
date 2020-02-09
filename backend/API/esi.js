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
    var errorExist = false;
    var solution;
    while (!fetchKMSuccess) {
        await rp(options)
        .then(response => {
            fetchKMSuccess = true;
            solution = response;
            //console.log(response);
            if (errorExist) {
                console.log("error solved by repeating call");
            }
        })
        .catch(async err => {
            console.log('Error in fetching CCP ESI endpoint for Killmail ' + killId + "with hash : " + killHash);
            await sleep(500);
            errorExist = true;
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

    var fetchCorpSuccess = false;
    var solution;
    var errorExist = false;
    while (!fetchCorpSuccess) {
        await rp(options)
        .then(response => {
            fetchCorpSuccess = true;
            solution = response;
            if (errorExist) {
                console.log("error solved by repeating call");
            }
            //console.log(response);
        })
        .catch(err => {
            console.log('Error in fetching corp info for corp id ' + corpId);
            errorExist = true;
            //console.log(err);
            //return err;
        });
    }
    return solution;
}

export async function getAllianceInfo(allianceId) {
    var url = 'https://esi.evetech.net/latest/alliances/' + allianceId + '/?datasource=tranquility';
    var options = {
        method: 'GET',
        uri: url,
        json: true
    };
    var fetchAllianceSuccess = false;
    var solution;
    var errorExist = false;
    while (!fetchAllianceSuccess) {
        await rp(options)
        .then(response => {
            fetchAllianceSuccess = true;
            solution = response;
            if (errorExist) {
                console.log("error solved by repeating call");
            }
            //console.log(response);
        })
        .catch(err => {
            console.log('Error in fetching alliance info for alliance id ' + allianceId);
            errorExist = true;
            //console.log(err);
        });
    }
    return solution;
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