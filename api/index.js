const serverless = require('serverless-http');
const app = require('../app');
const connectDB = require('../config/db');

// Connect DB before handling request
// app.use(async (req, res, next) => {
//   await connectDB();
//   next();
// });

app.get('/ping', (req, res) => {
  res.json({ message: "API working" });
});

module.exports = serverless(app);
