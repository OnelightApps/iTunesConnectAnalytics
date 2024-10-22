var itc = require('./../src/analytics.js');
const readline = require('readline');

const getData = async () => {
    const username = '';
    const password = '';
    const source = itc.source.search;
    return new Promise(async (resolve, reject) => {
        const instance = new itc.Itunes({
            twoFAHandler: function (successCallback) {
                const rl = readline.createInterface({input: process.stdin, output: process.stdout});
                rl.question('Enter the 2FA code: ', (code) => {
                    successCallback(code);
                });
            },
            successAuthCookies: async function (cookies) {
                console.log(cookies);
            },
            cookies: {}
        });

        await instance.login(username, password);
        const query = itc.AnalyticsQuery.appDetailsMeasures(1448103572, {
            measures: [itc.measures.pageViews, itc.measures.totalDownloads, itc.measures.conversionRate],
            group: {
                dimension: itc.dimension.territory,
                limit: 1000
            },
            dimensionFilters: [
                {dimensionKey: itc.dimensionFilterKey.productPage, optionKeys: ['3bca42e6-5ca6-4731-9b55-01694b8aefd3']},
            ],
        }).date('2024-10-20', '2024-10-21');

        instance.request(query, function(error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result.results);
            }
        });
    });
}

getData()
    .then((res) => {
        console.log(res)
    })
    .catch((err) => {
        console.log(err);
    })
