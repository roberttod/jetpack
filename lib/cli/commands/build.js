const fs = require('fs-extra')
const path = require('path')
const webpack = require('webpack')
const wpConf = require('../../../webpack.config')

module.exports = async function (options, log) {
  log.info('Building for production...')

  process.env.NODE_ENV = 'production'
  const webpackConfig = wpConf(options)
  const compiler = webpack(webpackConfig)

  const target = path.join(process.cwd(), options.dist)
  await fs.remove(target)

  compiler.run(async function (err, stats) {
    if (err) return console.log(err)
    if (options.static && isDir(path.join(options.dir, options.static))) {
      await fs.copy(path.join(options.dir, options.static), path.join(options.dir, options.dist, options.static))
    }
    console.log(stats.toString({
      colors: true
    }))
  })
}

function isDir (path) {
  try {
    return fs.lstatSync(path).isDirectory(path)
  } catch (err) {
    return false
  }
}
