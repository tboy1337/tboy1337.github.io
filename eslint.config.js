export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        AudioContext: 'readonly',
        webkitAudioContext: 'readonly',
        Float32Array: 'readonly',
        MutationObserver: 'readonly',
        google: 'readonly',
        self: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        skipWaiting: 'readonly',
        Cache: 'readonly',
        Request: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        importScripts: 'readonly',
        GameUtils: 'readonly',
        SwUtils: 'readonly',
        prompt: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        localStorage: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'no-undef': 'error'
    }
  },
  {
    files: ['tests/**/*.js', 'tests/**/*.ts'],
    languageOptions: {
      globals: {
        process: 'readonly'
      }
    }
  }
];
