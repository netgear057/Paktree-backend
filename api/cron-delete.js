const connectDB = require("../config/db");
const deleteOldProductsJob = require("../utils/DeleteExpireProductJob");

module.exports = async (req, res) => {
  try {
    await connectDB();

    const deletedCount = await deleteOldProductsJob();

    return res.status(200).json({
      success: true,
      deletedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
