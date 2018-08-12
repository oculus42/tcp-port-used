/* globals describe it after before */

const net = require('net');

const tcpPortUsed = require('../index');

let server;

function freePort(cb) {
  if (!server) {
    return cb(new Error('Port not in use'));
  }

  server.close();
  server.unref();
  server = undefined;
  return cb();
}

const makeErrEventCb = (cb, rmListeners) => (err) => {
  server.close();
  if (cb) {
    rmListeners();
    cb(err);
  }
  server = undefined;
};

const makeListenEventCb = (cb, rmListeners) => () => {
  if (cb) {
    rmListeners();
    cb();
  }
};

function bindPort(port, cb) {
  if (server) {
    cb(new Error('Free the server port, first.'));
    return;
  }

  let errEventCb;
  let listenEventCb;

  const rmListeners = () => {
    server.removeListener('error', errEventCb);
    server.removeListener('listening', listenEventCb);
  };

  server = net.createServer();
  server.listen(port);

  errEventCb = makeErrEventCb(cb, rmListeners);
  listenEventCb = makeListenEventCb(cb, rmListeners);

  server.on('error', errEventCb);
  server.on('listening', listenEventCb);
}

describe('waitUntilFree', function () {
  this.timeout(3000);

  before((cb) => {
    bindPort(44203, (err) => {
      cb(err);
    });
  });

  it('should reject promise for used port number after timeout', (done) => {
    tcpPortUsed.waitUntilFree({
      port: 44203, host: '127.0.0.1', retryTime: 250, timeout: 500,
    })
      .then(() => {
        done(new Error('waitUntilFree unexpectedly succeeded'));
      }, (err) => {
        if (err.message === 'timeout') {
          done();
        } else {
          done(err);
        }
      });
  });

  it('should fulfill promise for free port number', (done) => {
    tcpPortUsed.waitUntilFree({
      port: 44205, host: '127.0.0.1', retryTime: 100, timeout: 500,
    })
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should fulfill promise for free port number and default retry and timeout', (done) => {
    tcpPortUsed.waitUntilFree({ port: 44205 })
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should reject promise for invalid port number', (done) => {
    tcpPortUsed.waitUntilFree({})
      .then(() => {
        done(new Error('waitUntilFree unexpectedly succeeded'));
      }, (err) => {
        if (err.message === 'invalid port: undefined') {
          done();
        } else {
          done(err);
        }
      });
  });

  after((cb) => {
    freePort((err) => {
      cb(err);
    });
  });
});
