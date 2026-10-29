const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 390,   // iPhone 14/15 genişliği: mobil öncelikli
    viewportHeight: 844
  },
  video: true,            // her koşu cypress/videos/ altına kaydedilir → demo video buradan kesilir
  videoCompression: false
});
