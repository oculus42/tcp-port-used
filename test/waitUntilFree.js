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
