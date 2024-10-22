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
        const query = itc.AnalyticsQuery.appInfoCpp(1448103572);

        instance.request(query, function(error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
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
