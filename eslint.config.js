//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: ['*.config.js', 'src/components/ui/**'],
  },
  {
    rules: {
      'import/order': 'off',
      'sort-imports': 'off',
    },
  },
]
