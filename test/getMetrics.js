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
            },
            cookies: {
                myacinfo: 'myacinfo=DAWTKNV323952cf8084a204fb20ab2508441a07d02d37f2b6f4ef1de25b0187c68cc531ef50ca687358a30d9276df8494c3be7a95daec1f9f57ed9c7ca5a3a4704b7e7f5165ca1fbd3fa551abd1551aa70a93ffce25f5271359f764760d4eb4789073eea976f5d36ce7727f5b235a9157ee48c175a848c98154c4793b2a2f6dcc6f587b9be1ef8f55686a446efd302bfefa14a6e01a88334d311411f9c780c6e50e1c91364e4d5dac7781cef921272098058f53d96ad8989952ebfe3fd1494f676811d50dcbcb5a4c391a4dc092003e4f9ca24d21c21ee1ad1d83a3a1101ac00e11e4819a11334a308b7f83234214fae08cc24aff96fc38359d3a6b50195378a03fd3337f85fd4cdc3b808d181ed4742ed1dbaaeea65340537ef4fdefdf9c4e4e58cbfb95f83a1fac1f5db3f71dbe598a14fd6ee3fc5c29741fdc08cfc4d86b62df3d36e8cbff1d34fd0e3f3e2c192e99bb05fc69a8a0641ed141cf303f7253f581108428baae4c6cc69152a678405283cc158374362f3906fa28ad57beeff7c2be30c09462914ea5c969719b1ad9a168fde189d87975c17c9c8826fa8e302ad88ef6c737f292e2a2e94f7d2b70fb49db9b08f17b9eea5eef3f49fa89d18b9ce183bd115ee2d01f0715595b24df76e6db62bbf5ab68e40fd1e1267fb136baf63e334d07fa5bc1b450f65edf46c062630c297814ced7965c8f1ea69cf5c545d729c8d23963239337d9408217dc743ea4e3d427cde06c7ebf351fa9abde14c3fd0d0e22718cb88a7157be1412a2d68b1eb4254113060e97c4d08d2188d79368f15f5ca5afa1fdfb832b3dd42aed72b241d07b81045de08fca581245052b12c19809de3cecfa6399edca5aebdd8507f28bcdd3170c4ed694b358c544b26938b6c0bd6328e587526585a47V3;',
                DES553ca1001b431645116c4d613bc317e8e: 'DES553ca1001b431645116c4d613bc317e8e=HSARMTKNSRVXWFla8nhPzHZ0GIyI6usscfHEYF8kp5TZiTsOipv63AUSseKLcs/eYAyLzEdUUZ0TJ690GvtGlbam6O29Ltp2vGNYKLD7gItNK/CuZDjNKCFuMnMMjkWj5woWQCBF/T1AzcK3SezdIfRnegNr/lMzi0rk1ZHSnWg6mwh88/NBrrMUoNglHA==SRVX;'
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
