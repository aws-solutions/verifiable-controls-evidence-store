/* eslint-disable */
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: {
        SamlACS: './src/saml-acs.ts',
        CognitoACS: './src/cognito-acs.ts',
    },
    devtool: 'source-map',
    mode: 'development',
    target: 'node',
    plugins: [new CleanWebpackPlugin()],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    externals: [{ 'aws-sdk': 'commonjs aws-sdk' }],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name]/[name].js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'commonjs',
    },
};
