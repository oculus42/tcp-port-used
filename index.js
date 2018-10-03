/**
 * @fileOverview
 * A promise-based check to see if a TCP port is already in use.
 */

const net = require('net');
const util = require('util');
const is = require('is2');

// Global Values
const LOCALHOST = '127.0.0.1';

/**
 * Creates an options object from all the possible arguments
 * @param {Number|Object} options Options, or a valid TCP port number
 * @param {...*} [args] Remaining values.
 * - {String} [host] The DNS name or IP address.
 * - {Boolean} [inUse] The desired in use status to wait for
 * - {Number} [retryTime] the retry interval in ms. Default is 250ms
 * - {Number} [timeout] the amount of time to wait until port is free. Default is 2000ms
 * @return {Object} An options object with all the above parameters as properties.
 */
function makeOptionsObj(options, ...args) {
  // the first argument may be an object, if it is not, make an object
  let opts = options;
  if (!is.obj(options)) {
    const port = options;
    const [host, inUse, retryTime, timeout] = args;

    opts = {
      port,
      host,
      inUse,
      retryTime,
      timeout,
    };
  }

  if (!is.positiveInt(opts.retryTime)) {
    opts.retryTime = 250;
  }

  if (!is.positiveInt(opts.timeout)) {
    opts.timeout = 2000;
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
  const opts = Object.assign({
    host: LOCALHOST,
  }, makeOptionsObj(port, host));

  if (!is.port(opts.port)) {
    return Promise.reject(new Error(`invalid port: ${util.inspect(opts.port)}`));
  }

  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.once('connect', () => {
      resolve(true);
      cleanUpClient(client);
    });
    client.once('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        resolve(false);
      } else {
        reject(err);
      }
      cleanUpClient(client);
    });

    client.connect({
      port: opts.port,
      host: opts.host,
    });
  });
}

function pollCheck(resolve, reject, endTime, opts) {
  check(opts.port, opts.host).then((used) => {
    if (used === opts.inUse) {
      resolve();
    } else if (Date.now() < endTime) {
      setTimeout(pollCheck, opts.retryTime, resolve, reject, endTime, opts);
    } else {
      reject(new Error('timeout'));
    }
  }, (err) => {
    reject(err);
  });
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

  if (!is.bool(opts.inUse)) {
    return Promise.reject(new Error('inUse must be a boolean'));
  }

  const endTime = Date.now() + opts.timeout;

  return new Promise((resolve, reject) => pollCheck(resolve, reject, endTime, opts));
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
 * @param {String} [options.host] the hostname or IP address. Default is 127.0.0.1
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
