Gatling
=======
A simple node.js script that turns a simple single-process server into a multi-process [cluster]'d server with automatic restarting.

Plays nice with Express and similar libraries.

[![Build Status](https://travis-ci.org/nfriedly/node-gatling.png?branch=master)](https://travis-ci.org/nfriedly/node-gatling)

Installation
------------

    npm install --save gatlin

Recommended Setup
-----------------

Instead of calling `node server.js` call `npx gatling server.js`. It will start one manager process + one worker process for each logical CPU core.

### `package.json`

Add a `scripts.start` entry like so:

```js
{
  //...
  "scripts": {
    "start": "gatling app.js"
  }
}
```

Legacy Setup
------------

This was the only option in v1, and is preserved for backwards-compatibility.

Instead of starting the server, simply export the handler function and then call gatlin with the path to your `server.js` or `app.js`.

(The reason this was needed is that Gatlin ran each request inside a [domain](https://nodejs.org/api/domain.html) in v1. It prevented errors in one request from interfering with any other requests, but the API has since been deprecated.)

### Express

Just change

 ```js
 app.listen(port)
 ```
 
 to

```js
module.exports = app;
```

### HTTP

Your app should export the function that gets passed to `http.createServer` and not create the server itself.

For example, say your `app.js` looks like this:

```js
var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(1337);
```
    
Change it to this:

```js
module.exports = function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
});
```

Usage
-----

To start your server, run `npm start`. Or, to call gatling directly, run `./node_modules/bin/gatling app.js`

API
---

The following command line options are accepted

`-q`, `--quiet`: silences all non-error output
`--processes 2`: Set the number of worker processes. Defaults to one per CPU core.
`-p 1234`, `--port 1234`: defaults to the `PORT` or `VCAP_APP_PORT` (bluemix) environment properties, or 8080 if not set. (Only applies when gatling starts the server rathern than your app.)

# Changelog

# v2.0.0

* Removed Domain support
* Removed newrellic support
* Added support for regular app.js / server.js files that start call `listen()` themselves
* Bumped minimum Node.js version to 6.0.0

[cluster]: https://nodejs.org/api/cluster.html
[domain]: https://nodejs.org/api/domain.html
