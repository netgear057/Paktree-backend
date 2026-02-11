const serverless = require('serverless-http');
const app = require('../app');

app.get('/test', (req, res) => {
  res.json({ message: "Server working" });
});

module.exports = serverless(app);
