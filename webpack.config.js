const path = require('path')
const webpack = require('webpack')
const requireRelative = require('require-relative')

module.exports = function (options) {
  const config = {
    entry: {
      bundle: options.entry === '.' ? '.' : requireRelative.resolve(options.entry, process.cwd())
    },
    output: {
      path: path.join(process.cwd(), 'dist/'),
      filename: '[name].js',
      publicPath: '/dist/'
    },
    // devtool: 'eval',
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
        }
      })
    ],
    module: {
      loaders: [{
        test: /.js$/,
        loader: require.resolve('react-hot-loader/webpack')
      }, {
        test: /.js$/,
        loader: require.resolve('buble-loader'),
        query: {
          jsx: options.jsx,
          objectAssign: 'Object.assign',
          transforms: { templateString: false, modules: false }
        }
      }, {
        test: /\.css$/,
        loaders: [
          require.resolve('style-loader'),
          require.resolve('css-loader'),
          {
            loader: require.resolve('postcss-loader'),
            options: {
              plugins: function () {
                return [
                  require('autoprefixer')
                ]
              }
            }
          }
        ]
      }]
    },
    devServer: {
      noInfo: true,
      hot: true,
      inline: true,
      publicPath: '/dist/',
      historyApiFallback: {
        index: '/dist/'
      },
      stats: 'minimal'
      // stats: {
      //   assets: false,
      //   errors: true,
      //   errorDetails: true,
      //   warnings: true,
      //   colors: true
      // }
    }
  }

  if (options.build) {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({ minimize: true }))
  } else if (!options.start) {
    config.plugins.push(new webpack.HotModuleReplacementPlugin())
    Object.keys(config.entry).forEach(e => {
      config.entry[e] = [
        require.resolve('react-hot-loader/patch'),
        require.resolve('webpack-hot-middleware/client'),
        config.entry[e]
      ]
    })
  }

  return config
}
