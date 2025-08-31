export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  
  // Configurações de transformação
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Configurações de módulos
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/test/__mocks__/fileMock.js',
  },
  
  // Configurações de cobertura
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  
  // Configurações de teste
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
  
  // Configurações de ambiente
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  
  // Configurações de globais
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
  
  // Configurações de verbose
  verbose: true,
  
  // Configurações de timeout
  testTimeout: 10000,
  
  // Configurações de setup
  setupFiles: ['<rootDir>/src/test/setup.ts'],
  
  // Configurações de transformação de arquivos
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@supabase|@radix-ui))',
  ],
};
