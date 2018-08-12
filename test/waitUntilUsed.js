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

describe('waitUntilUsed', () => {
  before(() => {
    setTimeout(() => {
      bindPort(44204);
    }, 2000);
  });

  it('should wait until the port is listening', function (done) {
    this.timeout(5000);
    tcpPortUsed.waitUntilUsed({
      port: 44204, host: '127.0.0.1', retryTimeMs: 500, timeOutMs: 4000,
    })
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should reject promise when given an invalid port', function (done) {
    this.timeout(3000);
    tcpPortUsed.waitUntilUsed({
      port: 'hello', host: '127.0.0.1', retryTimeMs: 500, timeOutMs: 2000,
    })
      .then(() => {
        done(new Error('waitUntil used unexpectedly successful.'));
      }, (err) => {
        if (err.message === 'invalid port: \'hello\'') {
          done();
        } else {
          done(err);
        }
      });
  });

  it('should timeout when no port is listening', function (done) {
    this.timeout(3000);
    tcpPortUsed.waitUntilUsed({
      port: 44205, host: '127.0.0.1', retryTimeMs: 500, tmieOutMs: 2000,
    })
      .then(() => {
        done(new Error('waitUntil used unexpectedly successful.'));
      }, (err) => {
        if (err.message === 'timeout') {
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

describe('waitUntilUsed', () => {
  before(() => {
    setTimeout(() => {
      bindPort(44204);
    }, 2000);
  });

  it('should wait until the port is listening', function (done) {
    this.timeout(5000);
    tcpPortUsed.waitUntilUsed({ port: 44204, retryTimeMs: 500, timeOutMs: 4000 })
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should reject promise when given an invalid port', function (done) {
    this.timeout(3000);
    tcpPortUsed.waitUntilUsed({ port: 'hello', retryTimeMs: 500, timeOutMs: 2000 })
      .then(() => {
        done(new Error('waitUntil used unexpectedly successful.'));
      }, (err) => {
        if (err.message === 'invalid port: \'hello\'') {
          done();
        } else {
          done(err);
        }
      });
  });

  it('should timeout when no port is listening', function (done) {
    this.timeout(3000);
    tcpPortUsed.waitUntilUsed({ port: 44205, retryTimeMs: 500, timeOutMs: 2000 })
      .then(() => {
        done(new Error('waitUntil used unexpectedly successful.'));
      }, (err) => {
        if (err.message === 'timeout') {
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
