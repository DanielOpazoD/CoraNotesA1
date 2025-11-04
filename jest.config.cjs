module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleFileExtensions: ['js'],
  collectCoverageFrom: ['scripts/**/*.js'],
  coverageDirectory: 'coverage/unit',
  coverageProvider: 'v8'
};
