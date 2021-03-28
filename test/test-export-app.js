"use strict";
const cp = require("child_process"),
  assert = require("assert"),
  request = require("request"),
  gatlingPath = __dirname + "/../gatling";

describe("backwards-compatibility: should accept files that export app and don't start a server", function () {
  it("should start the test server and send a {type: 'ready'} message", function (done) {
    const g = cp
      .fork(gatlingPath, [
        "./test/fixtures/app-export.js",
        "--quiet",
        "--processes",
        "1",
      ])
      .once("message", function (msg) {
        assert("ready", msg.type); // sent by legacy code in gatling
        g.on("close", function () {
          done();
        });
        g.kill();
      });
  });

  it("should allow the app to respond to requests", function (done) {
    const g = cp
      .fork(gatlingPath, [
        "./test/fixtures/app-export.js",
        "--quiet",
        "--processes",
        "1",
      ])
      .once("message", function (/*msg*/) {
        request("http://localhost:8080/ok", function (err, data) {
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
        "./test/fixtures/app-export.js",
        "--quiet",
        "--processes",
        "1",
      ])
      .once("message", function (/*msg*/) {
        request("http://localhost:8080/slow", function (err, data) {
          if (err) return done(err);

          assert("ok", data);

          g.on("close", function () {
            done();
          });
          g.kill();
        });

        request("http://localhost:8080/error", function (/*err, data*/) {});
      });
  });

  it("should bring up new workers after one dies", function (done) {
    const g = cp
      .fork(gatlingPath, [
        "./test/fixtures/app-export.js",
        "--quiet",
        "--processes",
        "1",
      ])
      .once("message", function (/*msg*/) {
        request("http://localhost:8080/error", function (/*err, data*/) {
          request("http://localhost:8080/ok", function (err, data) {
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

  it("should handle situations where app.bind !== Function.prototype.bind", function (done) {
    const g = cp
      .fork(gatlingPath, [
        "./test/fixtures/app-bind.js",
        "--quiet",
        "--processes",
        "1",
      ])
      .once("message", function (/*msg*/) {
        request("http://localhost:8080/ok", function (err, data) {
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
