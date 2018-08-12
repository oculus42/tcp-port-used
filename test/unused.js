/* globals describe it after before */

const assert = require('assert');
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

describe('check functionality for unused port', () => {
  before((done) => {
    bindPort(44202, (err) => {
      done(err);
    });
  });

  it('should return true for a used port with default host value', (done) => {
    tcpPortUsed.check(44202)
      .then((inUse) => {
        assert.ok(inUse === true);
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should return true for a used port with default host value using arg object', (done) => {
    tcpPortUsed.check({ port: 44202 })
      .then((inUse) => {
        assert.ok(inUse === true);
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should return true for a used port with given host value using arg object', (done) => {
    tcpPortUsed.check({ port: 44202, host: '127.0.0.1' })
      .then((inUse) => {
        assert.ok(inUse === true);
        done();
      }, (err) => {
        assert.ok(false);
        done(err);
      });
  });


  it('should return true for a used port with given host value', (done) => {
    tcpPortUsed.check(44202, '127.0.0.1')
      .then((inUse) => {
        assert.ok(inUse === true);
        done();
      }, (err) => {
        assert.ok(false);
        done(err);
      });
  });

  it('should return false for an unused port and default host using arg object', (done) => {
    tcpPortUsed.check({ port: 44201 })
      .then((inUse) => {
        assert.ok(inUse === false);
        done();
      }, (err) => {
        done(err);
      });
  });


  it('should return false for an unused port and default host', (done) => {
    tcpPortUsed.check(44201)
      .then((inUse) => {
        assert.ok(inUse === false);
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should return false for an unused port and given default host using arg object', (done) => {
    tcpPortUsed.check({ port: 44201, host: '127.0.0.1' })
      .then((inUse) => {
        assert.ok(inUse === false);
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should return false for an unused port and given default host', (done) => {
    tcpPortUsed.check(44201, '127.0.0.1')
      .then((inUse) => {
        assert.ok(inUse === false);
        done();
      }, (err) => {
        done(err);
      });
  });

  after((cb) => {
    freePort((err) => {
      cb(err);
    });
  });
});
