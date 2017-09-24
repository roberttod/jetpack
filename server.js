const express = require('express')
const requireRelative = require('require-relative')
const url = require('url')
const chalk = require('chalk')
const proxy = require('express-http-proxy')
const expressLogger = require('./server/expressLogger')
const pkg = require('./package.json')

module.exports = function server () {
  const app = express()

  app.use(expressLogger())

  // const options = require('./server/options')
  const options = {
    // port: 4000
    // webpackPort: 5000,
    port: process.env.PORT,
    clientPort: process.env.CLIENT_PORT
  }

  // make the app stoppable, see the npm package
  app.stop = function () {}

  const _listen = app.listen
  app.listen = function listen (port, cb) {
    // mount the client side handling logic very last
    // app.use(options.__client)
    app.use(proxy(`http://localhost:${options.clientPort}`, {
      parseReqBody: false,
      preserveHostHdr: true,
      reqBodyEncoding: null
    }))

    return _listen.call(app, port || options.port, function onListen (...args) {
      cb && cb(...args)
    })
  }

  return app
}
