/* eslint-disable */
const AwsSamPlugin = require('aws-sam-webpack-plugin');
const path = require('path');

const awsSamPlugin = new AwsSamPlugin();

module.exports = {
    // Loads the entry object from the AWS::Serverless::Function resources in your
    // template.yaml or template.yml
    entry: awsSamPlugin.entry(),

    // Write the output to the .aws-sam/build folder
    output: {
        filename: '[name]/app.js',
        libraryTarget: 'commonjs2',
        path: __dirname + '/.aws-sam/build/',
    },

    // Create source maps
    devtool: 'source-map',

    // Resolve .ts and .js extensions
    resolve: {
        alias: {
            src: path.resolve(__dirname, 'src/'),
        },
        extensions: ['.ts', '.js'],
    },

    // Target node
    target: 'node',

    // Includes the aws-sdk only for development. The node10.x docker image
    // used by SAM CLI Local doens't include it but it's included in the actual
    // Lambda runtime.
    //externals: process.env.NODE_ENV === "development" ? [] : ["aws-sdk"],

    // Set the webpack mode
    mode: process.env.NODE_ENV || 'production',

    // Add the TypeScript loader
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
            },
        ],
    },
    plugins: [awsSamPlugin],

    externals: {
        'aws-sdk': 'aws-sdk',
    },
};
