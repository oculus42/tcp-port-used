/* globals describe it after before */

const assert = require('assert');
const net = require('net');

const tcpPortUsed = require('./index');

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

function bindPort(port, cb) {
  if (server) {
    cb(new Error('Free the server port, first.'));
    return;
  }

  let rmListeners;

  server = net.createServer();
  server.listen(port);

  function errEventCb(err) {
    server.close();
    if (cb) {
      rmListeners();
      cb(err);
    }
    server = undefined;
  }

  function listenEventCb() {
    if (cb) {
      rmListeners();
      cb();
    }
  }

  rmListeners = () => {
    server.removeListener('error', errEventCb);
    server.removeListener('listening', listenEventCb);
  };

  server.on('error', errEventCb);
  server.on('listening', listenEventCb);
}

describe('check arguments', () => {
  it('should not accept negative port numbers in an obj', (done) => {
    tcpPortUsed.check({ port: -20, host: '127.0.0.1' })
      .then(() => {
        done(new Error('check unexpectedly succeeded'));
      }, (err) => {
        assert.ok(err && err.message === 'invalid port: -20');
        done();
      });
  });

  it('should not accept negative port numbers', (done) => {
    tcpPortUsed.check(-20, '127.0.0.1')
      .then(() => {
        done(new Error('check unexpectedly succeeded'));
      }, (err) => {
        assert.ok(err && err.message === 'invalid port: -20');
        done();
      });
  });

  it('should not accept invalid types for port numbers in an obj', (done) => {
    tcpPortUsed.check({ port: 'hello', host: '127.0.0.1' })
      .then(() => {
        done(new Error('check unexpectedly succeeded'));
      }, (err) => {
        assert.ok(err && err.message === 'invalid port: \'hello\'');
        done();
      });
  });

  it('should not accept invalid types for port numbers', (done) => {
    tcpPortUsed.check('hello', '127.0.0.1')
      .then(() => {
        done(new Error('check unexpectedly succeeded'));
      }, (err) => {
        assert.ok(err && err.message === 'invalid port: \'hello\'');
        done();
      });
  });

  it('should require an argument for a port number in an obj', (done) => {
    tcpPortUsed.check({})
      .then(() => {
        done(new Error('check unexpectedly succeeded'));
      }, (err) => {
        assert.ok(err && err.message === 'invalid port: undefined');
        done();
      });
  });

  it('should require an argument for a port number', (done) => {
    tcpPortUsed.check()
      .then(() => {
        done(new Error('check unexpectedly succeeded'));
      }, (err) => {
        assert.ok(err && err.message === 'invalid port: undefined');
        done();
      });
  });

  it('should not accept port number > 65535 in an obj', (done) => {
    tcpPortUsed.check({ port: 65536 })
      .then(() => {
        done(new Error('check unexpectedly succeeded'));
      }, (err) => {
        assert.ok(err && err.message === 'invalid port: 65536');
        done();
      });
  });


  it('should not accept port number > 65535', (done) => {
    tcpPortUsed.check(65536)
      .then(() => {
        done(new Error('check unexpectedly succeeded'));
      }, (err) => {
        assert.ok(err && err.message === 'invalid port: 65536');
        done();
      });
  });

  it('should not accept port number < 0 in an obj', (done) => {
    tcpPortUsed.check({ port: -1 })
      .then(() => {
        done(new Error('check unexpectedly succeeded'));
      }, (err) => {
        assert.ok(err && err.message === 'invalid port: -1');
        done();
      });
  });

  it('should not accept port number < 0', (done) => {
    tcpPortUsed.check(-1)
      .then(() => {
        done(new Error('check unexpectedly succeeded'));
      }, (err) => {
        assert.ok(err && err.message === 'invalid port: -1');
        done();
      });
  });
});

describe('check functionality for unused port', () => {
  before((done) => {
    bindPort(44202, (err) => {
      done(err);
    });
  });

  it('should return true for a used port with default host value in an obj', (done) => {
    tcpPortUsed.check({ port: 44202 })
      .then((inUse) => {
        assert.ok(inUse === true);
        done();
      }, (err) => {
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

  it('should return true for a used port with default host value using arg obj', (done) => {
    tcpPortUsed.check({ port: 44202 })
      .then((inUse) => {
        assert.ok(inUse === true);
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should return true for a used port with given host value using arg obj', (done) => {
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

describe('waitUntilFreeOnHost', function () {
  this.timeout(2000);

  before((cb) => {
    bindPort(44203, (err) => {
      cb(err);
    });
  });

  it('should reject promise for used port number after timeout using an arg obj', (done) => {
    tcpPortUsed.waitUntilFreeOnHost({
      port: 44203, host: '127.0.0.1', retryTimeMs: 500, timeOutMs: 1000,
    })
      .then(() => {
        done(new Error('waitUntilFreeOnHost unexpectedly succeeded'));
      }, (err) => {
        if (err.message === 'timeout') {
          done();
        } else {
          done(err);
        }
      });
  });

  it('should reject promise for used port number after timeout', (done) => {
    tcpPortUsed.waitUntilFreeOnHost(44203, '127.0.0.1', 500, 1000)
      .then(() => {
        done(new Error('waitUntilFreeOnHost unexpectedly succeeded'));
      }, (err) => {
        if (err.message === 'timeout') {
          done();
        } else {
          done(err);
        }
      });
  });

  it('should fufill promise for free port number using an arg object', (done) => {
    tcpPortUsed.waitUntilFreeOnHost({
      port: 44205, host: '127.0.0.1', retryTimeMs: 500, timeOutM: 4000,
    })
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });


  it('should fufill promise for free port number', (done) => {
    tcpPortUsed.waitUntilFreeOnHost(44205, '127.0.0.1', 500, 4000)
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should fufill promise for free port number and default retry and timeout using an arg obj', (done) => {
    tcpPortUsed.waitUntilFreeOnHost({ port: 44205 })
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });


  it('should fufill promise for free port number and default retry and timeout', (done) => {
    tcpPortUsed.waitUntilFreeOnHost(44205)
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should reject promise for invalid port number using an arg obj', (done) => {
    tcpPortUsed.waitUntilFreeOnHost({})
      .then(() => {
        done(new Error('waitUntilFreeOnHost unexpectedly succeeded'));
      }, (err) => {
        if (err.message === 'invalid port: undefined') {
          done();
        } else {
          done(err);
        }
      });
  });

  it('should reject promise for invalid port number', (done) => {
    tcpPortUsed.waitUntilFreeOnHost()
      .then(() => {
        done(new Error('waitUntilFreeOnHost unexpectedly succeeded'));
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

describe('waitUntilUsedOnHost', () => {
  before(() => {
    setTimeout(() => {
      bindPort(44204);
    }, 2000);
  });

  it('should wait until the port is listening using an arg object', (done) => {
    this.timeout(5000);
    tcpPortUsed.waitUntilUsedOnHost({
      port: 44204, host: '127.0.0.1', retryTimeMs: 500, timeOutMs: 4000,
    })
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should wait until the port is listening', (done) => {
    this.timeout(5000);
    tcpPortUsed.waitUntilUsedOnHost(44204, '127.0.0.1', 500, 4000)
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should reject promise when given an invalid port using an arg object', (done) => {
    this.timeout(3000);
    tcpPortUsed.waitUntilUsedOnHost({
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

  it('should reject promise when given an invalid port', (done) => {
    this.timeout(3000);
    tcpPortUsed.waitUntilUsedOnHost('hello', '127.0.0.1', 500, 2000)
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

  it('should timeout when no port is listening using an arg obj', (done) => {
    this.timeout(3000);
    tcpPortUsed.waitUntilUsedOnHost({
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


  it('should timeout when no port is listening', (done) => {
    this.timeout(3000);
    tcpPortUsed.waitUntilUsedOnHost(44205, '127.0.0.1', 500, 2000)
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

describe('waitUntilFree', function () {
  this.timeout(5000);

  before((cb) => {
    bindPort(44203, (err) => {
      cb(err);
    });
  });

  it('should reject promise for used port number after timeout using arg obj', (done) => {
    tcpPortUsed.waitUntilFree({ port: 44203, retryTimeMs: 500, timeOutMs: 4000 })
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

  it('should reject promise for used port number after timeout', (done) => {
    tcpPortUsed.waitUntilFree(44203, 500, 4000)
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

  it('should fufill promise for free port number using arg object', (done) => {
    tcpPortUsed.waitUntilFree({ port: 44205, retryTimeMs: 500, timeOutMs: 4000 })
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should fufill promise for free port number', (done) => {
    tcpPortUsed.waitUntilFree(44205, 500, 4000)
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should fufill promise for free port number and default retry and timeout using arg object', (done) => {
    tcpPortUsed.waitUntilFree({ port: 44205 })
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should fufill promise for free port number and default retry and timeout', (done) => {
    tcpPortUsed.waitUntilFree(44205)
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should reject promise for invalid port number using arg object', (done) => {
    tcpPortUsed.waitUntilFree({})
      .then(() => {
        done(new Error('waitUntilFreeOnHost: unexpectedly succeeded'));
      }, (err) => {
        if (err.message === 'invalid port: undefined') {
          done();
        } else {
          done(err);
        }
      });
  });

  it('should reject promise for invalid port number', (done) => {
    tcpPortUsed.waitUntilFree()
      .then(() => {
        done(new Error('waitUntilFreeOnHost: unexpectedly succeeded'));
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

describe('waitUntilUsed', () => {
  before(() => {
    setTimeout(() => {
      bindPort(44204);
    }, 2000);
  });

  it('should wait until the port is listening using arg obj', (done) => {
    this.timeout(5000);
    tcpPortUsed.waitUntilUsed({ port: 44204, retryTimeMs: 500, timeOutMs: 4000 })
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should wait until the port is listening', (done) => {
    this.timeout(5000);
    tcpPortUsed.waitUntilUsed(44204, 500, 4000)
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should reject promise when given an invalid port using arg object', (done) => {
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

  it('should reject promise when given an invalid port', (done) => {
    this.timeout(3000);
    tcpPortUsed.waitUntilUsed('hello', 500, 2000)
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

  it('should timeout when no port is listening using arg obj', (done) => {
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

  it('should timeout when no port is listening', (done) => {
    this.timeout(3000);
    tcpPortUsed.waitUntilUsed(44205, 500, 2000)
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

describe('waitForStatus', () => {
  before(() => {
    setTimeout(() => {
      bindPort(44204);
    }, 2000);
  });

  it('should wait until the port is listening using arg obj', (done) => {
    this.timeout(5000);
    tcpPortUsed.waitForStatus({
      port: 44204, host: '127.0.0.1', inUse: true, retryTimeMs: 500, timeOutMs: 4000,
    })
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should wait until the port is listening', (done) => {
    this.timeout(5000);
    tcpPortUsed.waitForStatus(44204, '127.0.0.1', true, 500, 4000)
      .then(() => {
        done();
      }, (err) => {
        done(err);
      });
  });

  it('should reject promise when given an invalid port using arg object', (done) => {
    this.timeout(3000);
    tcpPortUsed.waitForStatus({
      port: 'hello', host: '127.0.0.1', inUse: false, retryTimeMs: 500, timeOutMs: 2000,
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

  it('should reject promise when given an invalid port', (done) => {
    this.timeout(3000);
    tcpPortUsed.waitForStatus('hello', '127.0.0.1', false, 500, 2000)
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

  it('should timeout when no port is listening using arg obj', (done) => {
    this.timeout(3000);
    tcpPortUsed.waitUntilUsed({
      port: 44205, host: '127.0.0.1', inUse: true, retryTimeMs: 500, timeOutMs: 2000,
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

  it('should timeout when no port is listening', (done) => {
    this.timeout(3000);
    tcpPortUsed.waitUntilUsed(44205, '127.0.0.1', true, 500, 2000)
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
