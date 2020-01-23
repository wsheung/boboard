var rp = require('request-promise');

export async function getHistoricalForCorp(year, month, corpId, page) {
    var url = 'https://zkillboard.com/api/w-space/corporationID/' + corpId + '/year/' + year + '/month/' + month + '/page/' + page + '/';
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
            console.log('Error in fetching historical info for corp id ' + corpId + " in month year : " + month + "/" + year);
            console.log(err);
            return null;
        });
}

export async function fetchKMFromRedisQ() {
    var redisUrl = 'https://redisq.zkillboard.com/listen.php?queueID=wormboard';
    var options = {
        method: 'GET',
        uri: redisUrl,
        json: true,
    };

    return rp(options)
        .then((response) => {
            return response;
        })
        .catch(async (err) => {
            console.log('Error in fetching redisQ!');
            return await fetchKMFromRedisQ();
        });
}