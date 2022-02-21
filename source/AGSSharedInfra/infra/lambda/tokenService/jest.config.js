/* eslint-disable */
module.exports = {
    roots: ['<rootDir>/test'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    collectCoverage: true,
    collectCoverageFrom: ['!src/localrunner/**'],
    coverageDirectory: '../coverage/tokenService',
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: -10,
        },
    },
    verbose: true,
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: '../reports/tokenService',
                outputName: 'unit_test_report.xml',
            },
        ],
    ],
};
