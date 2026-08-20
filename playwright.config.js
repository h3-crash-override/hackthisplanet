// @ts-check
const { defineConfig } = require('@playwright/test')

// Allow Node.js fetch (used in helpers/beforeAll) to tolerate SSL inspection proxies
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

module.exports = defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./tests/global-setup.js'),
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || 'https://hackthisplanet.vercel.app',
    headless: true,
    ignoreHTTPSErrors: true,
  },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
})
