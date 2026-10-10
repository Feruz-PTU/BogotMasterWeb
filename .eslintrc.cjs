module.exports = {
    root: true,
    env: { browser: true, es2021: true, node: true },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
    ],
    // dist-ssr is the generated server bundle; linting build output reports
    // errors in third-party code that cannot be fixed here.
    ignorePatterns: ['dist', 'dist-ssr', 'node_modules', '.eslintrc.cjs', '*.config.js'],
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
    settings: { react: { version: '18.2' } },
    plugins: ['react-refresh'],
    rules: {
        'react/prop-types': 'off',
        // Off: context files intentionally co-export a provider + its hook.
        // This rule is a dev-only Fast Refresh hint, not a correctness check.
        'react-refresh/only-export-components': 'off',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
};
