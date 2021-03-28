#!/usr/bin/env node
"use strict";
/**
 * Gatling: makes your node server multicore and automatically restarts failed processes
 */
const path = require("path");
const cluster = require("cluster");
const argv = require("optimist")
  .usage("Usage: $0 <your app.js>")
  .alias("p", "port")
  .describe("p", "Port number")
  .alias("q", "quiet")
  .describe("q", "Silence all non-error output")
  .describe(
    "processes",
    "how many processes to run (default is one per cpu core)"
  )
  .alias("processes", "threads") // for backwards compatibility / ease of use
  .demand("_").argv;
const log = argv.q ? function () {} : console.log.bind(console);

// master vars and methods
const numWorkers = argv.threads || require("os").cpus().length;
let childCount = 0;
const startTime = Date.now();

function createWorker() {
  if (Date.now() - startTime < 1000 && childCount > numWorkers) {
    throw new Error("Too many instant deaths");
  }

  const worker = cluster.fork();
  childCount++;

  // this is mainly for automated tests, but might be useful in other contexts
  if (process.send) {
    worker.on("message", function (message) {
      process.send(message);
    });
  }
}

const appFile = path.normalize(path.join(process.cwd(), argv._[0]));

if (cluster.isMaster) {
  // if we're in the master process, create one worker for each cpu core
  for (let i = 0; i < numWorkers; i++) {
    createWorker();
  }

  // when the worker dies create a new one
  cluster.on("exit", function (/*deadWorker*/) {
    createWorker();
  });

  log(
    "Gatling master thread setting up workers to run %s and listen on port %s",
    appFile
  );
} else {
  let server = null;
  process.on("message", function (message) {
    //todo: see if this helps with unit testing
    if (message.type == "kill") {
      // make sure we close down within 30 seconds
      const killtimer = setTimeout(function () {
        throw new Error("server failed to shut down within 30 seconds");
      }, 30000);
      // But don't keep the process open just for that!
      killtimer.unref();

      // stop taking new requests.
      if (server) {
        server.close();
      }

      // Let the master know we're dead.  This will trigger a
      // 'disconnect' in the cluster master, and then it will fork
      // a new worker.
      cluster.worker.disconnect();
    }
  });

  const http = require("http");
  const port =
    argv.port || process.env.PORT || process.env.VCAP_APP_PORT || 8080;

  let serverCreated = false;
  const createServer = http.createServer;
  http.createServer = function () {
    serverCreated = true;
    return createServer.apply(http, arguments);
  };

  const app = require(appFile);

  // for backwards compatibility, create a http server if the app exports a function and doesn't create a server
  if (!serverCreated && typeof app === "function") {
    server = createServer(app);
    server.listen(port, function () {
      process.send({ type: "ready", port });
    });
  }

  log("Gatling worker thread %s up and listening", cluster.worker.id);
}
