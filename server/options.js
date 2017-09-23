let options = {}

module.exports = options

module.exports.__set = function set (_options) {
  Object.assign(options, _options)
}
