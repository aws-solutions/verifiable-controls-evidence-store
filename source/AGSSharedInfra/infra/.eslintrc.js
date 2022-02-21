/* eslint-disable */
const path = require('path');
module.exports = {
    root: true,
    env: {
        node: true,
        es2020: true,
    },
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint', 'header'],
    rules: {
        'header/header': [2, path.join(__dirname, '..', 'LicenseHeader.txt')],

        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        'no-undef': 0,
        'no-func-assign': 0,

        'padding-line-between-statements': [
            'error',
            {
                blankLine: 'always',
                prev: ['export', 'class'],
                next: '*',
            },
        ],
    },
};
