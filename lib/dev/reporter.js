const chalk = require('chalk')

module.exports = function reporter (log) {
  return function reporter (middlewareOptions, options) {
    const { state, stats } = options
    if (state && !stats.hasErrors() && !stats.hasWarnings()) {
      printAssets(stats.toJson(), log)
    }
  }
}

const getText = (arr, row, col) => {
  return arr[row][col].value
}

const table = (array, align, log) => {
  const rows = array.length
  const cols = array[0].length
  const colSizes = new Array(cols)
  for (let col = 0; col < cols; col++) colSizes[col] = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const value = `${getText(array, row, col)}`
      if (value.length > colSizes[col]) {
        colSizes[col] = value.length
      }
    }
  }
  for (let row = 0; row < rows; row++) {
    let buf = ''
    for (let col = 0; col < cols; col++) {
      const format = (...args) => { buf += array[row][col].color(...args) }
      const value = `${getText(array, row, col)}`
      let l = value.length
      if (align[col] === 'l') format(value)
      if (col !== cols - 1) {
        for (; l < colSizes[col]; l++) buf += chalk.white(' ')
      }
      if (align[col] === 'r') format(value)
      if (col + 1 < cols && colSizes[col] !== 0) {
        buf += chalk.white('  ')
      }
    }
    log.info(buf)
  }
}

const getAssetColor = (asset, defaultColor) => {
  if (asset.name.endsWith('.js.map') ||
      asset.name.endsWith('.hot-update.js') ||
      asset.name === 'manifest.json') {
    return chalk.gray
  }

  if (asset.isOverSizeLimit) {
    return chalk.yellow
  }

  return defaultColor
}

function printAssets (obj, log) {
  const modules = {}
  obj.modules.forEach(module => {
    module.chunks.forEach(chunk => {
      modules[chunk] = modules[chunk] || 0
      modules[chunk] += 1
    })
  })

  const assets = obj.assets
    .sort((a, b) => {
      return a.name > b.name ? 1 : -1
    })
    .sort((a, b) => {
      const aExt = a.name.split('.')[a.name.split('.').length - 1]
      const bExt = b.name.split('.')[b.name.split('.').length - 1]
      return aExt > bExt ? 1 : -1
    })

  if (assets && obj.assets.length > 0) {
    const t = [
      [
        {
          value: 'Asset',
          color: chalk.bold
        },
        {
          value: 'Modules',
          color: chalk.bold
        },
        {
          value: 'Size',
          color: chalk.bold
        }
      ]
    ]
    for (const asset of assets) {
      t.push([
        {
          value: asset.name,
          color: getAssetColor(asset, chalk.white)
        },
        {
          value: asset.name.endsWith('.js') && !asset.name.endsWith('.hot-update.js')
            ? asset.chunks.reduce((acc, chunk) => acc + modules[chunk], 0)
            : '-',
          color: asset.name.endsWith('.js') && !asset.name.endsWith('.hot-update.js')
            ? getAssetColor(asset, chalk.white)
            : chalk.gray
        },
        {
          value: formatSize(asset.size),
          color: getAssetColor(asset, chalk.white)
        }
      ])
    }
    table(t, 'lll', log)
  }
}

function formatSize (size) {
  if (size <= 0) {
    return '0 bytes'
  }
  const abbreviations = ['bytes', 'KiB', 'MiB', 'GiB']
  const index = Math.floor(Math.log(size) / Math.log(1024))
  return `${+(size / Math.pow(1024, index)).toPrecision(3)} ${
    abbreviations[index]
  }`
}
