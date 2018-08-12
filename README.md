port-used
=============

[![npm](https://img.shields.io/npm/v/port-used.svg)](https://www.npmjs.com/package/port-used) 
[![Build Status](https://travis-ci.org/oculus42/port-used.svg?branch=master)](https://travis-ci.org/oculus42/port-used) 
[![Code Climate](https://codeclimate.com/github/oculus42/port-used/badges/gpa.svg)](https://codeclimate.com/github/oculus42/port-used) 
[![Test Coverage](https://codeclimate.com/github/oculus42/port-used/badges/coverage.svg)](https://codeclimate.com/github/oculus42/port-used/coverage) 
[![Dependencies](https://david-dm.org/oculus42/port-used.svg)](https://david-dm.org/oculus42/port-used) 
[![Greenkeeper badge](https://badges.greenkeeper.io/oculus42/port-used.svg)](https://greenkeeper.io/) 

A Node.js module to check if a TCP port is currently in use. It returns a promise.
Based on [tcp-port-used](https://www.npmjs.com/package/tcp-port-used)

## Installation

    npm install port-used

## Examples
To check a port's state:

```javascript
var portUsed = require('port-used');

portUsed.check(44201, '127.0.0.1')
.then((inUse) => {
  console.log('Port 44201 usage: '+inUse);
}, (err) => {
  console.error('Error on check:', err.message);
});
```

To wait until a port on a host is available:

```javascript
portUsed.waitUntilFree({
  port: 44203,
  host: 'some.host.com',
  retryTime: 500,
  timeout: 4000,
}).then(() => {
  console.log('Port 44203 on some.host.com is now free.');
}, (err) => {
  console.log('Error:', err.message);
});
```


To wait until a port on a host is accepting connections:

```javascript
portUsed.waitUntilUsed({
  port: 44204,
  host: 'some.host.com',
  retryTime: 500,
  timeout: 4000,
}).then(() => {
  console.log('Port 44204 on some.host.com is now in use.');
}, (err) => {
  console.log('Error:', err.message);
});
```

To wait until a port on a host is in specific state:

```javascript
portUsed.waitForStatus({
  port: 44204,
  host: 'some.host.com',
  inUse: true,
  retryTime: 500,
  timeout: 4000,
}).then(() => {
  console.log('Port 44204 on some.host.com is now in use.');
}, (err) => {
  console.log('Error:', err.message);
});
```

## API

### check(port [, host])
Checks if a TCP port is in use by attempting to connect to the port on host.
If no host is specified, the module uses '127.0.0.1' (localhost). When the
promise is resolved, there is a parameter `inUse`, when true means the port is
in use and false means the port is free.

**Parameters:**

* **Number|Object** *port* The port you are curious to see if available. If an
  object, must contain all the parameters as properties.
* **String** *[host]* The host name or IP address of the host. Default is '127.0.0.1'.

**Returns:**

**Promise** A promise.

### waitUntilFree(options)
Returns a promise and fulfills it only when the host's socket is
free.  Will retry on an interval specified in retryTime until the timeout. If
not defined the retryTime is 250 ms and the timeout is 2000 ms. If the host is
not defined, the modules uses the default '127.0.0.1'.

**Parameters:**

* **Object** *options* an object of the following:
  * **Number** *port* a valid TCP port number.
  * **String** *[host]* The host name or IP address of the host. Default, if not defined: '127.0.0.1'
  * **Number** *[retryTime]* the retry interval in ms. Default is 250ms.
  * **Number** *[timeout]* the amount of time to wait until port is free. Default is 2000ms.

**Returns:**

**Promise** A promise.

### waitUntilUsed(options)
Returns a promise and fulfills it only when the socket is accepting
connections. Will retry on an interval specified in retryTime until the
timeout. If not defined, the retryTime is 250 ms and the timeout is 2000 ms.
If the host is not defined the module uses the default '127.0.0.1'.

**Parameters:**

* **Object** *options* an object of the following:
  * **Number** *port* a valid TCP port number.
  * **String** *[host]* The host name or IP address of the host. Default is '127.0.0.1'
  * **Number** *[retryTime]* the retry interval in ms. Default is 250ms.
  * **Number** *[timeout]* the amount of time to wait until port is free. Default is 2000ms.

**Returns:**

**Promise** A promise.

### waitForStatus(options)
Waits until the port on host matches the boolean status in terms of use. If the
status is true, the promise defers until the port is in use. If the status is
false the promise defers until the port is free. If the host is undefined or
null, the module uses the default '127.0.0.1'. Also, if not defined the
retryTime is 250 ms and the timeout is 2000 ms.

**Parameters:**

* **Object** *options* an object of the following:
  * **Number** *port* a valid TCP port number.
  * **String** *[host]* The host name or IP address of the host. Default is '127.0.0.1'
  * **Boolean** *inUse* A boolean describing the condition to wait for in terms of "in use."  
    True indicates wait until the port is in use. False indicates wait until the port is free.
  * **Number** *[retryTime]* the retry interval in ms. Default is 250ms.
  * **Number** *[timeout]* the amount of time to wait until port is free. Default is 2000ms.

**Returns:**

**Promise** A promise.

## License

The MIT License (MIT)

Copyright (c) 2018 oculus42  
Copyright (c) 2013 jut-io (stdarg)

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
