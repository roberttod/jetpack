const express = require('express')
const requireRelative = require('require-relative')
const chalk = require('chalk')
// const proxy = require('express-http-proxy')
const pkg = require('./package.json')

module.exports = function server () {
  const app = express()
  const options = require('./server/options')

  // make the app stoppable, see the npm package
  app.stop = function () {}

  const _listen = app.listen
  app.listen = function listen (port, cb) {
    // mount the client side handling logic very last
    app.use(options.__client)

    return _listen.call(app, port || options.port, function onListen (...args) {
      cb && cb(...args)
      console.log(chalk.yellow(`[jetpack] ${pkg.version} 🚀`))
      console.log(chalk.yellow(`[jetpack] Serving client from ${requireRelative.resolve(options.client, process.cwd())}`))
      console.log(chalk.yellow(`[jetpack] Running server from ${requireRelative.resolve(options.server, process.cwd())}`))
      console.log(chalk.green(`[jetpack] App started on http://localhost:${port || options.port}`))
    })
  }

  return app
}
