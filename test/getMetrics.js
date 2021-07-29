var itc = require('./../src/analytics.js');
const readline = require('readline');

const getMetrics = async () => {
    const username = 'andrew.stoliarov@onelightapps.io';
    const password = '0c6dc2d2D1';
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
                //console.log(cookies);
            },
            cookies: {
                myacinfo: 'myacinfo=DAWTKNV323952cf8084a204fb20ab2508441a07d02d395c03da4563f0610c198d0979cd60ba6acc75004ea8d7d453517835ef06d67b828e5926283794459ca3dd6961bd32f5b878f0296f3fa669bea4dc919ccb0225b46aba81fb4dad89ca964884556226b6cbc4688f0df1d4df25c78ce99ed55f828380dce7ac1d96a6cf369585d35467bb92ef66f1e7727afc1faefe71a32b90c3bbf37238ccb91298753fb86c67f68d433d790ffeb4f6469212fba0f778cf4c17feae5ceb830ba56c934ab6a12d214d895c14ecf1f9495399c8de39c5882c461d1adae539c1423e86f8a5f820ac68bd18fcbf5fb554816400d1305a284a25a1bad402110116fe3b7bdaf5b4796ecb32ac9159db41e9adaaaed82efa62338ca499cb427bad656d9ca893e79a832c665c319f26cab94407c308079a7109cd039c1483eeb45ddebfec5a9f3643ab4517a3796d8351825fdafd745cda7b2c050bf0f9effc2d9ea7aba8a611ac03969babfee0526276f8eeeb4220e8331166951d3498451c9ec9f8efe555c52e3f6f22d94bbaafea556fa02d0ce5816266a4ce8b2dcfc44abeada714a3ecad780b6b73d6c57e8dcb14c7c54f4fdad9b0ea1cb1e023fe69fc98cfb87c6d4bb8ae2d207c543d021263e69154cff4cbd53fe3fb10c359c82db737f7c887e17a57ffb5d449362561a1dd47abf33945eaca1c7fad23eb121599eb1e74831e1c6fc75d94963ee964c0091193b4710269cca943180f91174bc637a60d13c962f8875cfa759c20f7abce6585a47V3;',
                itctx: 'itctx=eyJjcCI6MTIzMjY5NDI2LCJkcyI6MTcxOTU2OTA4NTcsImV4IjoiMjAyMS03LTI5IDIxOjI2OjYifQ|f2auehf6qeiqke33qd7p522f2o|3oacuRr5Xehxt664Rccog-pNIDk;',
                dqsid: 'dqsid=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2Mjc1NjUxNjYsImp0aSI6IjRNZlVYb3BxSjJVTGVyVkNwMjJubUEifQ.SMFu2F2lbzXv7KAmqxAN0tO_irgg6LPtmq62Fl1hTpI;'
            }
        });

        await instance.login(username, password);

        const query = itc.AnalyticsQuery.metrics(1171686996, {
            measures: 'installs',
            group: {
                dimension: itc.dimension.territory,
                limit: 1000
            },
            dimensionFilters: [
                {dimensionKey: itc.dimension.sourceType, optionKeys: [source]},
            ],
        }).date('2021-06-10', '2021-06-20');

        await instance.changeProvider(123269426);
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
        //console.log(err);
    })
