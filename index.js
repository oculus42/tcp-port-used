/**
 * @fileOverview
 * A simple promises-based check to see if a TCP port is already in use.
 */

// define the exports first to avoid cyclic dependencies.

const net = require('net');
const util = require('util');
const is = require('is2');

// Global Values
const TIMEOUT = 2000;
const RETRY_TIME = 250;
const LOCALHOST = '127.0.0.1';

function getDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    resolve,
    reject,
    promise,
  };
}

/**
 * Creates an options object from all the possible arguments
 * @param {Number|Object} port a valid TCP port number
 * @param {String} host The DNS name or IP address.
 * @param {Boolean} inUse The desired in use status to wait for
 * @param {Number} retryTime the retry interval in ms. Default is 250ms
 * @param {Number} timeout the amount of time to wait until port is free. Default is 2000ms
 * @return {Object} An options object with all the above parameters as properties.
 */
function makeOptionsObj(port, host, inUse, retryTime, timeout) {
  // the first argument may be an object, if it is not, make an object
  let opts;
  if (is.obj(port)) {
    opts = port;
  } else {
    opts = {
      port,
      host,
      inUse,
      retryTime,
      timeout,
    };
  }

  if (!is.positiveInt(opts.retryTime)) {
    opts.retryTime = RETRY_TIME;
  }

  if (!is.positiveInt(opts.timeout)) {
    opts.timeout = TIMEOUT;
  }

  if (is.nullOrUndefined(opts.host)) {
    opts.host = LOCALHOST;
  }

  return opts;
}

function cleanUpClient(client) {
  if (client) {
    client.removeAllListeners('connect');
    client.removeAllListeners('error');
    client.end();
    client.destroy();
    client.unref();
  }
}

/**
 * Checks if a TCP port is in use by creating the socket and binding it to the
 * target port. Once bound, successfully, it's assume the port is available.
 * After the socket is closed or in error, the promise is resolved.
 * Note: you have to be super user to correctly test system ports (0-1023).
 * @param {Number|Object} port The port you are curious to see if available.
 *   If an object, must have the parameters as properties.
 * @param {String} [host] The hostname or IP address where the socket is.
 * @return {Promise} A promise.
 *
 * Example usage:
 *
 * const portUsed = require('port-used');
 * portUsed.check(22, '127.0.0.1')
 * .then((inUse) => {
 * }, (err) => {
 *   console.error('Error on check: '+util.inspect(err));
 * });
 */
function check(port, host) {
  const deferred = getDeferred();
  const opts = Object.assign({
    host: LOCALHOST,
  }, makeOptionsObj(port, host));

  if (!is.port(opts.port)) {
    return Promise.reject(new Error(`invalid port: ${util.inspect(opts.port)}`));
  }

  const client = new net.Socket();
  client.once('connect', () => {
    deferred.resolve(true);
    cleanUpClient(client);
  });
  client.once('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      deferred.resolve(false);
    } else {
      deferred.reject(err);
    }
    cleanUpClient(client);
  });

  client.connect({
    port: opts.port,
    host: opts.host,
  });

  return deferred.promise;
}

/**
 * Creates a promise and fulfills it only when the socket's usage
 * equals status in terms of 'in use' (false === not in use, true === in use).
 * Will retry on an interval specified in retryTime.  Note: you have to be
 * super user to correctly test system ports (0-1023).
 * @param {Object} options
 * @param {Number} options.port a valid TCP port if a number.
 * @param {Boolean} options.inUse The desired in use status to wait for
 * @param {String} [options.host] The hostname or IP address where the socket is.
 * @param {Number} [options.retryTime] the retry interval in ms. Default is 250ms
 * @param {Number} [options.timeout] time to wait until port is free. Default is 2000ms
 * @return {Promise} A promise.
 *
 * Example usage:
 *
 * const portUsed = require('port-used');
 * portUsed.waitForStatus({
 *   port: 44204,
 *   host: 'some.host.com',
 *   inUse: true,
 *   retryTime: 500,
 *   timeout: 4000
 * }).then(() => {
 *   console.log('Port 44204 is now in use.');
 * }, (err) => {
 *   console.log('Error: ', error.message);
 * });
 */

function waitForStatus(options) {
  const opts = makeOptionsObj(options);
  const deferred = getDeferred();
  let timeoutId;
  let timedOut = false;
  let retryId;

  if (!is.bool(opts.inUse)) {
    deferred.reject(new Error('inUse must be a boolean'));
    return deferred.promise;
  }

  function cleanUp() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (retryId) {
      clearTimeout(retryId);
    }
  }

  function timeoutFunc() {
    timedOut = true;
    cleanUp();
    deferred.reject(new Error('timeout'));
  }

  timeoutId = setTimeout(timeoutFunc, opts.timeout);

  function doCheck() {
    check(opts.port, opts.host)
      .then((used) => {
        if (timedOut) {
          return;
        }
        if (used === opts.inUse) {
          deferred.resolve();
          cleanUp();
        } else {
          retryId = setTimeout(() => {
            doCheck();
          }, opts.retryTime);
        }
      }, (err) => {
        if (timedOut) {
          return;
        }
        deferred.reject(err);
        cleanUp();
      });
  }

  doCheck();
  return deferred.promise;
}

/**
 * Creates a promise and fulfills it only when the socket is free.
 * Will retry on an interval specified in retryTime.
 * Note: you have to be super user to correctly test system ports (0-1023).
 * @param {Number} options.port a valid TCP port number
 * @param {String} [options.host] The hostname or IP address where the socket is.
 * @param {Number} [options.retryTime] the retry interval in ms. Default is 250ms.
 * @param {Number} [options.timeout] the time to wait until port is free. Default is 2000ms.
* @return {Promise} A promise.
 *
 * Example usage:
 *
 * const portUsed = require('port-used');
 * portUsed.waitUntilFree({
 *   port: 44203,
 *   host: 'some.host.com'
 *   retryTime: 500,
 *   timeout: 4000
 * }).then(() => {
 *   console.log('Port 44203 is now free.');
 * }, (err) => {
 *   console.log('Error: ', error.message);
 * });
 */
function waitUntilFree(options) {
  // the first argument may be an object, if it is not, make an object
  const opts = Object.assign({}, makeOptionsObj(options), {
    inUse: false,
  });

  return waitForStatus(opts);
}

/**
 * Creates a promise and fulfills it only when the socket is used.
 * Will retry on an interval specified in retryTime.
 * Note: you have to be super user to correctly test system ports (0-1023).
 * @param {Object} options
 * @param {Number} options.port a valid TCP port number.
 * @param {string} [options.host] the hostname or IP address. Default is LOCALHOST
 * @param {Number} [options.retryTime] the retry interval in ms. Default is 500ms
 * @param {Number} [options.timeout] the time to wait until port is free. Default is 2000ms
* @return {Promise} A promise.
 *
 * Example usage:
 *
 * const portUsed = require('port-used');
 * portUsed.waitUntilUsed({
 *   port: 44204,
 *   host: 'some.host.com',
 *   retryTime: 500,
 *   timeout: 4000
 * }).then(() => {
 *   console.log('Port 44204 is now in use.');
 * }, (err) => {
 *   console.log('Error: ', error.message);
 * });
 */
function waitUntilUsed(options) {
  // the first argument may be an object, if it is not, make an object
  const opts = Object.assign({}, makeOptionsObj(options), {
    inUse: true,
  });

  return waitForStatus(opts);
}

exports.check = check;
exports.makeOptionsObj = makeOptionsObj;
exports.waitUntilFree = waitUntilFree;
exports.waitUntilUsed = waitUntilUsed;
exports.waitForStatus = waitForStatus;
