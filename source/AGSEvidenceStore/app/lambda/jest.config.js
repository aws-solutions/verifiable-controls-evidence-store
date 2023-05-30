/* eslint-disable */
module.exports = {
    roots: ['<rootDir>'],
    modulePaths: ['<rootDir>'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.ts',
        'evidences-stream-processor/**/*.ts',
        '!src/data/*.ts',
        '!src/common/BaseContainer.ts',
    ],

    verbose: true,

    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: -20,
        },
    },
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: './reports',
                outputName: 'test_report.xml',
            },
        ],
    ],
};
