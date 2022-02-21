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
        'header/header': [2, path.join(__dirname, '..', '..', 'LicenseHeader.txt')],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-unused-vars': [
            'warn',
            { argsIgnorePattern: '^_.*', varsIgnorePattern: '^_.*' },
        ],
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
    ignorePatterns: ['**/__mocks__/**'],
};
