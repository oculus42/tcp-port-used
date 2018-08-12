/* globals describe it */

const assert = require('assert');
const tcpPortUsed = require('../index');

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

  it('should error if inUse is not a Boolean', function (done) {
    this.timeout(5000);
    tcpPortUsed.waitForStatus({
      port: 44204, inUse: 'bad',
    })
      .then(() => {
        done(new Error(' inUse unexpectedly successful.'));
      }, (err) => {
        if (err.message === 'inUse must be a boolean') {
          done();
        } else {
          done(err);
        }
      });
  });
});
