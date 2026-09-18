import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
      '.agents/**',
      '.opencode/**',
      '.codex/**',
      '.impeccable/**',
      '.codebase-memory/**',
      'project-context/**',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
]

export default eslintConfig
