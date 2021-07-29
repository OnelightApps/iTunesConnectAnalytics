var itc = require('./../src/analytics.js');
const readline = require('readline');

const getMetrics = async () => {
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
            }
        });

        await instance.login(username, password);

        const query = itc.AnalyticsQuery.metrics(1448103572, {
            measures: 'installs',
            group: {
                dimension: itc.dimension.territory,
                limit: 1000
            },
            dimensionFilters: [
                {dimensionKey: itc.dimension.sourceType, optionKeys: [source]},
            ],
        }).date('2021-06-10', '2021-06-20');

        //await instance.changeProvider(123269426);
        instance.request(query, function(error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result.results);
            }
        });
    });
}

getMetrics()
    .then((res) => {
        console.log(res)
    })
    .catch((err) => {
        console.log(err);
    })
