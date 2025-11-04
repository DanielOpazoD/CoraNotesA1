module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleFileExtensions: ['js'],
  collectCoverageFrom: ['scripts/**/*.js'],
  coverageDirectory: 'coverage/integration',
  coverageProvider: 'v8'
};
