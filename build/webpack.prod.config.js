const path = require('path');
const merge = require('webpack-merge');
const baseConf = require('./webpack.base.config');

module.exports = merge(baseConf, {
    mode: 'production',
    devtool: 'source-map',
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, '../app')
    }
});