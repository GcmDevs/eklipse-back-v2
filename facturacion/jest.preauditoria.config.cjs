module.exports = {
  rootDir: '.',
  roots: ['<rootDir>/src/preauditoria'],
  testRegex: '.*\\.spec\\.ts$',
  testEnvironment: 'node',
  testTimeout: 30000,
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/../@common/$1',
    '^@inn/authorities$': '<rootDir>/authorities',
    '^@env$': '<rootDir>/../env.ts',
  },
};
