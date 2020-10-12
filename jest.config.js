module.exports = {
  preset: 'react-native',
  testPathIgnorePatterns: ['./node_modules/', './lib/'],
  modulePathIgnorePatterns: ['./lib/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/__flow__/**',
  ],
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: {
      // @TODO push up over time
      branches: 25,
      functions: 36,
      lines: 50,
      statements: 50,
    },
  },
  setupFilesAfterEnv: ['./jest/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/jest/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg)$': '<rootDir>/jest/__mocks__/fileMock.js',
  },
  snapshotSerializers: ['enzyme-to-json/serializer'],
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/react-native/jest/preprocessor.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!react-native|react-navigation|react-navigation-stack|react-native-gesture-handler)/',
  ],
};
