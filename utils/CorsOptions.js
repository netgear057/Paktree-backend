

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");
 const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow requests like Postman or mobile apps
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
};
module.exports = corsOptions