import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'scripts/**/*', 'src/**/*']
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
