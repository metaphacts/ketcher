/*
 * Copyright (C) 2015-2018, metaphacts GmbH
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, you can receive a copy
 * of the GNU Lesser General Public License from http://www.gnu.org/
 */

const path = require('path');
const webpack = require('webpack');
const PostCssPrefixWrap = require('postcss-prefixwrap');

module.exports = {
  mode: 'development',
  entry: './bundle.js',
  output: {
	path: path.resolve(__dirname, '../dist'),
    filename: 'ketcher-bundle.js',
    library: {
      type: 'commonjs',
    }
  },
  resolve: {
    alias: {
      'ketcher.svg': path.resolve(__dirname, '../dist/ketcher.svg'),
      'library.sdf': path.resolve(__dirname, '../dist/library.sdf'),
      'library.svg': path.resolve(__dirname, '../dist/library.svg'),
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  PostCssPrefixWrap('.ketcher-bundle', {
                    prefixRootTags: true,
                  })
                ],
              },
            },
          },
        ],
      },
      {test: /.*ketcher\.svg$/, loader: 'raw-loader'},
      {test: /.*library\.svg$/, loader: 'raw-loader'},
      {test: /.*library\.sdf$/, loader: 'raw-loader'},
    ]
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  externals: {
    'babel-polyfill': true,
    'classnames': true,
    'filesaver.js': true,
    'font-face-observer': true,
    'jsonschema': true,
    'lodash': true,
    'normalize.css': true,
    'preact': true,
    'preact-redux': true,
    'query-string': true,
    'raphael': true,
    'redux': true,
    'redux-logger': true,
    'redux-thunk': true,
    'reselect': true,
    'resemblejs': true,
    'subscription': true,
    'w3c-keyname': true,
    'whatwg-fetch': true
  }
};
