/* eslint-disable */
module.exports = {
    roots: ['<rootDir>'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    collectCoverage: true,
    collectCoverageFrom: ['index.ts'],
    coverageDirectory: '../coverage/securityHeader',
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
                outputDirectory: '../reports/securityHeader',
                outputName: 'unit_test_report.xml',
            },
        ],
    ],
};
