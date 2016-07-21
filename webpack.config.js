var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'blog/static/script');
var APP_DIR = path.resolve(__dirname, 'blog/static/script' );

var config = {
  watch: true,
  entry: APP_DIR + '/index.js',
  output: {
    path: BUILD_DIR,
    filename: 'bundle.js'
  },
  module : {
    loaders: [
          {
            test: /\.jsx?$/,
            exclude: /(node_modules)/,
            loader: 'babel-loader',
            query: {
              presets: ['es2015', 'react']
            }
          },

    {
        test: /masonry|imagesloaded|fizzy\-ui\-utils|desandro\-|outlayer|get\-size|doc\-ready|eventie|eventemitter/,
        loader: 'imports?define=>false&this=>window'
    }
    ]
  },

  plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production')
        }
      })
    ]

};

module.exports = config;
