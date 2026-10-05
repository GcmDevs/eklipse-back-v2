const { pathsToModuleNameMapper } = require('ts-jest');
const ts = require('typescript');
const { config } = ts.readConfigFile(
  require('path').join(__dirname, 'tsconfig.json'),
  ts.sys.readFile
);

module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/apps/gestion-clinica/entrega-turnos/**/*.spec.ts'],
  moduleNameMapper: pathsToModuleNameMapper(
    Object.fromEntries(
      Object.entries(config.compilerOptions.paths).sort(([a], [b]) => b.length - a.length)
    ),
    { prefix: '<rootDir>/' }
  ),
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
};
