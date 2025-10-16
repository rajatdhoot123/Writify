export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [0],
    'subject-empty': [0],
    'type-empty': [0],
    'subject-full-stop': [0],
    'header-max-length': [0],
  },
};
