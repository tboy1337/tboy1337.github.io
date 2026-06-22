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
        FormData: 'readonly',
        navigator: 'readonly',
        IntersectionObserver: 'readonly',
        importScripts: 'readonly',
        GameUtils: 'readonly',
        SwUtils: 'readonly',
        prompt: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        localStorage: 'readonly',
        HTMLElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        TouchEvent: 'readonly',
        Response: 'readonly',
        ServiceWorkerGlobalScope: 'readonly',
        ExtendableEvent: 'readonly',
        FetchEvent: 'readonly'
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
    files: ['site-sw-register.js'],
    languageOptions: {
      sourceType: 'script'
    }
  },
  {
    files: ['sw.js', 'site-sw-register.js'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }]
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
