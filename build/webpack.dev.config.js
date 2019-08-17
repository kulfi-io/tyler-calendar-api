const path = require('path');
const merge = require('webpack-merge');
const baseConf = require('./webpack.base.config');


module.exports = merge(baseConf, {
    
    mode: 'development',
    devtool: 'inline-source-map',
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist')
    },
});
