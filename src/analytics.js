'use strict';
const _ = require('underscore');
const request = require('request-promise');
const async = require('async');
const url = require('url');
const query = require('./query.js');
const {GSASRPAuthenticator} = require('./GSASRPAuthenticator.js');
const Itunes = function(options){
  this.options = {
    baseURL: 'https://appstoreconnect.apple.com/olympus/v1',
    authURL: 'https://idmsa.apple.com/appleauth/auth',
    settingsURL: 'https://appstoreconnect.apple.com/analytics/api/v1',
    checkUrl: 'https://appstoreconnect.apple.com/olympus/v1/session',
    appleWidgetKey: 'e0b80c3bf78523bfe80974d320935bfa30add02e1bff88ec2166c6bd5a706c42',
    concurrentRequests: 2,
    cookies: {},
    twoFAHandler: function(successCallback) {console.log('2FA handler');},
    errorExternalCookies: async function () {console.log('External headers error');},
    successAuthCookies: async function (headers) {}
  };

  _.extend(this.options, options);

  // Private
  this._cookies = this.options.cookies;
  this._queue = async.queue(
    this.executeRequest.bind(this),
    this.options.concurrentRequests
  );
  this._queue.pause();
};

Itunes.prototype.executeRequest = function(task, callback) {
  const query = task.query;
  const completed = task.completed;

  const requestBody = query.assembleBody();
  const uri = url.parse(query.apiURL + query.endpoint);

  if(requestBody && requestBody.csv) {
    var isCSVRequest = true
    delete requestBody.csv
    var params = new URLSearchParams({data: JSON.stringify(requestBody)}).toString()
  }

  const config = {
    uri: uri,
    method: query.method,
    headers: this.getHeaders(),
    timeout: 300000, //5 minutes
    json: requestBody,
    resolveWithFullResponse: true
  };

  if(isCSVRequest) {
    delete config.json
    config['form'] = params
  }

  request(config).then(response => {
    completed(null, response.body)
    callback();
  }).catch(error => {
    completed(error, null);
    callback();
  });
}

Itunes.prototype.signin = function(path, body) {
  return request.post(`${this.options.authURL}/signin/${path}`, {
    headers: {
      'X-Apple-Widget-Key': this.options.appleWidgetKey,
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Content-Type': 'application/json',
    },
    resolveWithFullResponse: true,
    json: body
  })
}

Itunes.prototype.check = async function() {
  try {
    const config = {
      url: this.options.checkUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Apple-Widget-Key': this.options.appleWidgetKey,
        'Cookie': this.getCookies(),
      },
      resolveWithFullResponse: true
    };
    const responseCheck = await request.get(config);
    return Promise.resolve(responseCheck.statusCode === 200);
  } catch (e) {
    return Promise.resolve(false);
  }
}

Itunes.prototype.login = async function(username, password) {
  if (await this.check()) {
    this._queue.resume();
    await this.options.successAuthCookies(this._cookies);
    return Promise.resolve();
  }
  const authenticator = new GSASRPAuthenticator(username);
  let initData = await authenticator.getInit();

  return new Promise((resolve, reject) => {
    this.signin('init', initData)
        .then(async (initResp) => {
          let proof = await authenticator.getComplete(password, initResp.toJSON().body);
          let completeResp = await this.signin("complete?isRememberMeEnabled=false", {
            ...proof,
            rememberMe: false,
          })
          return Promise.resolve(completeResp.toJSON());
        })
        .catch((resRaw) => {
          const res = resRaw.response.toJSON();
          if (res.statusCode === 412) {
            const cookies = res.headers['set-cookie'];
            const headers = {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              scnt: res.headers['scnt'],
              'X-Apple-ID-Session-Id': res.headers['x-apple-id-session-id'],
              'X-Apple-Widget-Key': this.options.appleWidgetKey,
              'X-Requested-With': 'XMLHttpRequest',
              'X-Apple-Domain-Id': '3',
              Cookie: cookies
                .map((cookie) => cookie.split(';')[0])
                .join('; '),
            };
        return request.post({
          url: `https://idmsa.apple.com/appleauth/auth/repair/complete`,
          headers: headers,
          resolveWithFullResponse: true,
        });
      }

      if (res.statusCode !== 409) {
        return Promise.reject(res);
      }

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'scnt': res.headers['scnt'],
        'X-Apple-ID-Session-Id': res.headers['x-apple-id-session-id'],
        'X-Apple-Widget-Key': this.options.appleWidgetKey,
        'X-Requested-With': 'XMLHttpRequest',
        'X-Apple-Domain-Id': '3',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors'
      };
      //We need to get the 2fa code
      return this.TwoFAHandler(res, headers);

    }).then((response) => {
      const cookies = response.headers['set-cookie'];
      if (!(cookies && cookies.length)) {
        throw new Error('There was a problem with loading the login page cookies. Check login credentials.');
      }
      const myAccount = /myacinfo=.+?;/.exec(cookies); //extract the account info cookie
      const des = /(DES.+?)=(.+?;)/.exec(cookies);
      if (myAccount == null || myAccount.length == 0) {
        throw new Error('No account cookie :( Apple probably changed the login process');
      }

      if (des !== null && des.length !== 0) {
        this._cookies[des[1]] = des[0];
      }
      this._cookies.myacinfo = myAccount[0];

      return request.get({
        url: `${this.options.baseURL}/session`,
        followRedirect: false,
        headers: this.getHeaders(),
        resolveWithFullResponse: true
      });
    }).then(async (response) => {
      this.loginComplete(response);
      await this.options.successAuthCookies(this._cookies)
      resolve();
    }).catch((err) => {
      reject(err)
    });
  })
};

Itunes.prototype.TwoFAHandler = function(res, headers) {
  return new Promise((resolve, reject) => {
    this.options.twoFAHandler((code) => {
      resolve(code);
    });
  }).then((code) => {
    return request.post({
      url: `${this.options.authURL}/verify/trusteddevice/securitycode`,
      headers: headers,
      json: {securityCode: {code: code}},
      resolveWithFullResponse: true
    }).then((res) => {
      return request.get({
        url: `${this.options.authURL}/2sv/trust`,
        headers: headers,
        resolveWithFullResponse: true
      });
    }).catch((res) => {
      return Promise.reject(res);
    });
  });
}

Itunes.prototype.HSA2Handler = function(res, headers) {
  return new Promise((resolve, reject) => {
        return request.get({
          url: this.options.authURL,
          headers: headers,
          resolveWithFullResponse: true
        }).then((res) => {
          this.options.twoFAHandler((code) => {
            resolve(code);
          });
        })
  }).then((code) => {
    return request.post({
      url: `${this.options.authURL}/verify/trusteddevice/securitycode`,
      headers: headers,
      json: {securityCode: {code: code}},
      resolveWithFullResponse: true
    }).then((res) => {
      return request.get({
        url: `${this.options.authURL}/2sv/trust`,
        headers: headers,
        resolveWithFullResponse: true
      });
    }).catch((res) => {
      return Promise.reject(res);
    });
  });
}

Itunes.prototype.loginComplete = function(response) {
  const cookies = response.headers['set-cookie'];
  if (!(cookies && cookies.length)) {
    throw new Error('There was a problem with loading the login page cookies.');
  }

  this._queue.resume();
}

Itunes.prototype.changeProvider = function(providerId) {
  return new Promise(((resolve, reject) => {
    request.post({
      url: `${this.options.baseURL}/session`,
      headers: this.getHeaders(),
      json: {provider: {providerId: providerId}},
      resolveWithFullResponse: true
    }).then((res) => {
      const cookies = res.headers['set-cookie'];
      resolve()
    }).catch((err) => {
      reject(err);
    })
  }));
};

Itunes.prototype.getApps = function(callback) {
  const url = `${this.options.settingsURL}/app-info/all`;
  this.getAPIURL(url, callback);
};

Itunes.prototype.getSettings = function(callback) {
  const url = `${this.options.settingsURL}/settings/all`;
  this.getAPIURL(url, callback);
};

Itunes.prototype.request = function(query, callback) {
  this._queue.push({
    query: query,
    completed: callback
  });
};

Itunes.prototype.getAPIURL = function(uri, callback) {
  async.whilst((callback) => {
    callback(null, this._queue.paused);
  }, (callback) => {
    setTimeout(() => callback(null), 500);
  }, (err) => {
    request.get({
      uri: uri,
      headers: this.getHeaders()
    }).then((res) => {
      const data = JSON.parse(res);
      callback(null, data);
    }).catch((err) => {
      callback(err, null);
    });
  });
}

Itunes.prototype.getCookies = function() {
  return Object.keys(this._cookies).reduce((cookies, cookieName) => {
    return cookies + `${this._cookies[cookieName]} `
  }, '').trim()
};

Itunes.prototype.getHeaders = function() {
  return {
    'Content-Type': 'application/json;charset=UTF-8',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://analytics.itunes.apple.com',
    'X-Requested-By': 'analytics.itunes.apple.com',
    'Referer': 'https://analytics.itunes.apple.com/',
    'Cookie': this.getCookies()
  };
}

module.exports.Itunes = Itunes;
module.exports.AnalyticsQuery = query.AnalyticsQuery;
module.exports.frequency = query.frequency;
module.exports.measures = query.measures;
module.exports.dimension = query.dimension;
module.exports.dimensionFilterKey = query.dimensionFilterKey;
module.exports.region = query.region;
module.exports.territory = query.territory;
module.exports.platform = query.platform;
module.exports.source = query.source;
module.exports.frequency = query.frequency;
module.exports.queryType = query.queryType;
