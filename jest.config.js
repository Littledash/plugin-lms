const esModules = [
  // file-type and all dependencies: https://github.com/sindresorhus/file-type
  'file-type',
  'strtok3',
  'readable-web-to-node-stream',
  'token-types',
  'peek-readable',
  'locate-path',
  'p-locate',
  'p-limit',
  'yocto-queue',
  'unicorn-magic',
  'path-exists',
  'qs-esm',
  'uint8array-extras',
  'uuid',
  'payload',
  '@payloadcms/next',
  '@payloadcms/ui',
  '@payloadcms/graphql',
  '@payloadcms/translations',
  '@payloadcms/db-mongodb',
  '@payloadcms/richtext-lexical',
].join('|')

/** @type {import('jest').Config} */
const customJestConfig = {
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transformIgnorePatterns: [
    `/node_modules/(?!.pnpm)(?!(${esModules})/)`,
    `/node_modules/.pnpm/(?!(${esModules.replace(/\//g, '\\+')})@)`,
  ],
  testEnvironment: 'node',
  // The MongoDB driver and memory server keep internal handles open after teardown
  forceExit: true,
  testTimeout: 90000,
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  verbose: true,
  testMatch: ['<rootDir>/**/*int.spec.ts', '<rootDir>/**/*.unit.spec.ts', '<rootDir>/**/*.unit.spec.tsx'],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/dev/helpers/emptyModule.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/dev/helpers/emptyModule.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
}

export default customJestConfig
