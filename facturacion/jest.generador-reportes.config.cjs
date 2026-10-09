module.exports = {
  rootDir: '.',
  roots: ['<rootDir>/src/generador-reportes'],
  testRegex: '.*\\.spec\\.ts$',
  testEnvironment: 'node',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/../@common/$1',
    '^@inn/authorities$': '<rootDir>/authorities',
    '^@env$': '<rootDir>/../env.ts',
  },
};
