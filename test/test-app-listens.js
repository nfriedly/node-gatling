"use strict";
const cp = require("child_process"),
  assert = require("assert"),
  request = require("request"),
  gatlingPath = __dirname + "/../gatling";

describe("recommended mode: app.js creates server", function () {
  it("should allow the app to respond to requests", function (done) {
    const g = cp
      .fork(gatlingPath, [
        "./test/fixtures/app.js",
        "--quiet",
        "--processes",
        "1",
      ])
      .once("message", function ({ type, port }) {
        assert("ready", type); // sent by app.js
        assert(port);
        request(`http://localhost:${port}/ok`, function (err, data) {
          if (err) return done(err);

          assert("ok", data);

          g.on("close", function () {
            done();
          });
          g.kill();
        });
      });
  });

  it("should not allow errors in one request to kill another request", function (done) {
    const g = cp
      .fork(gatlingPath, [
        "./test/fixtures/app.js",
        "--quiet",
        "--processes",
        "1",
      ])
      .once("message", function ({ port }) {
        request(`http://localhost:${port}/ok`, function (err, data) {
          if (err) return done(err);

          assert("ok", data);

          g.on("close", function () {
            done();
          });
          g.kill();
        });

        request(`http://localhost:${port}/error`, function (/*err, data*/) {});
      });
  });

  it("should bring up new workers after one dies", function (done) {
    const g = cp
      .fork(gatlingPath, [
        "./test/fixtures/app.js",
        "--quiet",
        "--processes",
        "1",
      ])
      .once("message", function ({ port }) {
        request(`http://localhost:${port}/error`, function (/*err, data*/) {
          request(`http://localhost:${port}/ok`, function (err, data) {
            if (err) return done(err);

            assert("ok", data);

            g.on("close", function () {
              done();
            });
            g.kill();
          });
        });
      });
  });
});
