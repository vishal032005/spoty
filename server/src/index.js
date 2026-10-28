const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  🎵 Spoty Legal Keyless Backend running on port ${PORT}`);
  console.log(`  🔍 Search Endpoint: http://localhost:${PORT}/api/search?q=coldplay`);
  console.log(`  📁 Categories Endpoint: http://localhost:${PORT}/api/categories`);
  console.log(`  ⚡ Rate Limit: 120 req/min | Cache: Enabled`);
  console.log(`  🛡️ 100% Free, Keyless, Legal APIs (No Private Tokens)`);
  console.log(`====================================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => console.log('Server terminated'));
});
process.on('SIGINT', () => {
  server.close(() => console.log('Server stopped'));
});
