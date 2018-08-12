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

describe('waitForStatus', () => {
  before(() => {
    setTimeout(() => {
      bindPort(44204);
    }, 250);
  });

  it('should wait until the port is listening', function (done) {
    this.timeout(1000);
    tcpPortUsed.waitForStatus({
      port: 44204, host: '127.0.0.1', inUse: true, retryTime: 100, timeout: 500,
    })
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should reject promise when given an invalid port', function (done) {
    this.timeout(1000);
    tcpPortUsed.waitForStatus({
      port: 'hello', host: '127.0.0.1', inUse: false, retryTime: 100, timeout: 500,
    })
      .then(() => {
        done(new Error('waitForStatus unexpectedly successful.'));
      }, (err) => {
        if (err.message === 'invalid port: \'hello\'') {
          done();
        } else {
          done(err);
        }
      });
  });

  it('should timeout when no port is listening', function (done) {
    this.timeout(1000);
    tcpPortUsed.waitForStatus({
      port: 44205, host: '127.0.0.1', inUse: true, retryTime: 100, timeout: 500,
    })
      .then(() => {
        done(new Error('waitForStatus unexpectedly successful.'));
      }, (err) => {
        if (err.message === 'timeout') {
          done();
        } else {
          done(err);
        }
      });
  });

  it('should timeout quickly', function (done) {
    this.timeout(1000);
    tcpPortUsed.waitForStatus({
      port: 44205, host: '127.0.0.1', inUse: true, retryTime: 100, timeout: 1,
    })
      .then(() => {
        done(new Error('waitForStatus unexpectedly successful.'));
      }, (err) => {
        if (err.message === 'timeout') {
          done();
        } else {
          done(err);
        }
      });
  });

  it('should error with a bad host', function (done) {
    this.timeout(1000);
    tcpPortUsed.waitForStatus({
      port: 44205, host: 'badhost', inUse: true, retryTime: 100, timeout: 500,
    })
      .then(() => {
        done(new Error('waitForStatus unexpectedly successful.'));
      }, (err) => {
        if (err.message !== 'timeout') {
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
