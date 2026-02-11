// const cron = require('node-cron');
// const  Product =  require('../models/Product')

// const startExpireFeaturedJob = () => {
//   cron.schedule("0 0 * * *", async () => {
//     const now = new Date();
//     const result = await Product.updateMany(
//       { featured: true, featuredExpiresAt: { $lte: now } },
//       { $set: { featured: false } }
//     );
//     console.log(`Expired ${result.modifiedCount} featured posts`);
//   });
// }
// module.exports = startExpireFeaturedJob


const Product = require('../models/Product');

const expireFeaturedJob = async () => {
  const now = new Date();

  const result = await Product.updateMany(
    { featured: true, featuredExpiresAt: { $lte: now } },
    { $set: { featured: false } }
  );

  console.log(`Expired ${result.modifiedCount} featured posts`);

  return result.modifiedCount;
};

module.exports = expireFeaturedJob;
