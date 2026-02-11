const connectDB = require('../config/db');
const expireFeaturedJob = require('../utils/CronJob');

module.exports = async (req, res) => {
  try {
    await connectDB();

    const count = await expireFeaturedJob();

    return res.status(200).json({
      success: true,
      expiredCount: count,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
