/* eslint-disable */
const path = require('path');

module.exports = {
    // Loads the entry object from the AWS::Serverless::Function resources in your
    // template.yaml or template.yml
    entry: {
        's3-evidence-collector': './s3-evidence-collector/index.ts',
    },

    // Write the output to the .aws-sam/build folder
    output: {
        filename: '[name]/index.js',
        libraryTarget: 'commonjs2',
        path: __dirname + '/.aws-sam/build/',
    },

    // Create source maps
    devtool: 'source-map',

    // Resolve .ts and .js extensions
    resolve: {
        alias: {
            src: path.resolve(__dirname, 'src/'),
            's3-evidence-collector': path.resolve(__dirname, 's3-evidence-collector'),
        },
        extensions: ['.ts', '.js'],
    },

    // Target node
    target: 'node',

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
    externals: {
        '@aws-sdk/client-s3': '@aws-sdk/client-s3',
        '@aws-sdk/client-secrets-manager': '@aws-sdk/client-secrets-manager',
        SyntheticsLogger: 'SyntheticsLogger',
        Synthetics: 'Synthetics',
    },
};
