const fs = require('fs')
const path = require('path')
const express = require('express')
const webpack = require('webpack')
const requireRelative = require('require-relative')
const chalk = require('chalk')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const wpConf = require('../webpack.config')
const render = require('./render')
const nodemon = require('nodemon')

// nodemon.on('start', function () {
//   console.log('App has started');
// }).on('quit', function () {
//   console.log('App has quit');
//   process.exit();
// }).on('restart', function (files) {
//   console.log('App restarted due to: ', files);
// });

module.exports = async function jetpack (cliOptions) {
  // get pkg meta
  let pkg
  try {
    pkg = JSON.parse(fs.readFileSync('./package.json'))
  } catch (err) {
    pkg = { name: 'jetpack' }
  }

  // detect how to compile jsx
  let jsx = 'h'
  try {
    requireRelative.resolve('preact', process.cwd())
    jsx = 'Preact.h'
  } catch (err) {}
  try {
    requireRelative.resolve('react', process.cwd())
    jsx = 'React.createElement'
  } catch (err) {}

  // combine defaults/pkg/cli options
  const options = Object.assign({
    port: 3000,
    jsx: jsx,
    html: null,
    public: 'public'
  }, pkg.jetpack, cliOptions)

  if (options.start) {
    return client({ pkg, options })
  }

  const webpackConfig = wpConf(options)
  const compiler = webpack(webpackConfig)

  // HMM
  options.client = options.entry
  options.server = './server'
  require('./options').__set(options)

  if (options.build) {
    build({ pkg, options, webpackConfig, compiler })
  } else {

    console.log(chalk.yellow(`[jetpack] ${pkg.version} 🚀`))
    console.log(chalk.yellow(`[jetpack] Serving client from ${requireRelative.resolve(options.client, process.cwd())}`))
    console.log(chalk.yellow(`[jetpack] Running server from ${requireRelative.resolve(options.server, process.cwd())}`))

    const clientPort = await client({ pkg, options, webpackConfig, compiler })

    options.webpackPort = clientPort
    require('./options').__set({ webpackPort: clientPort })

    const s = await server({ pkg, options, clientPort })

    console.log(chalk.green(`[jetpack] App started on http://localhost:${options.port}`))
  }
}

function build ({ compiler }) {
  // if we're building, switch to prod env
  process.env.NODE_ENV = 'production'
  compiler.run(function (err, stats) {
    if (err) return console.log(err)
    console.log(stats.toString())
  })
}

async function client ({ pkg, options, webpackConfig, compiler }) {
  const app = express()

  let html
  if (options.html) {
    html = fs.readFileSync(path.join(process.cwd(), options.html))
  }

  // no runtime webpack in start mode
  if (options.start) {
    app.use('/dist', express.static(path.join(process.cwd(), 'dist')))
  } else {
    app.use(webpackDevMiddleware(compiler, Object.assign({}, webpackConfig.devServer)))
    app.use(webpackHotMiddleware(compiler))
  }

  app.use(express.static(path.join(process.cwd(), options.public)))

  app.get('*', function (req, res) {
    res.send(html || render({ name: pkg.name }))
  })

  return new Promise (function (resolve) {
    let server = app.listen(0, () => {
      return resolve(server.address().port)
    })
  })
}

async function server ({ pkg, options, clientPort }) {
  require('nodemon/lib/utils').log.required(false)

  nodemon({
    exec: `PORT=${options.port} CLIENT_PORT=${clientPort} node ${options.server}`,
    ext: 'js json yml',
    ignore: options.client
  })
}
