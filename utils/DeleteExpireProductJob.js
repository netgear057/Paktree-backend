// const cron = require("node-cron");
// const Product = require("../models/Product");
// const supabase = require("../config/supabase");

// const deleteOldProductsJob = () => {
//   cron.schedule("0 1 * * *", async () => {
//     try {
//       const now = new Date();
//       const cutoffDate = new Date(now.setDate(now.getDate() - 30));

//       // Find all non-featured products older than 30 days
//       const productsToDelete = await Product.find({
//         featured: false,
//         createdAt: { $lte: cutoffDate },
//       });

//       if (!productsToDelete.length) {
//         console.log("No old non-featured products to delete.");
//         return;
//       }

//       // Delete images from Supabase
//       for (const product of productsToDelete) {
//         if (product.image) {
//           try {
//             // Extract file path from Supabase public URL
//             const url = new URL(product.image);
//            const path = url.pathname.split("/").slice(5).join("/"); 

//             const { error } = await supabase.storage
//               .from("manddi")
//               .remove([path]);

//             if (error) {
//               console.error(`Failed to delete image for product ${product._id}:`, error.message);
//             } else {
//               console.log(`Deleted image for product ${product._id}`);
//             }
//           } catch (err) {
//             console.error(`Invalid image URL for product ${product._id}`, err);
//           }
//         }
//       }

//       // Delete products from DB
//       const { deletedCount } = await Product.deleteMany({
//         _id: { $in: productsToDelete.map((p) => p._id) },
//       });

//       console.log(`Deleted ${deletedCount} old non-featured products.`);
//     } catch (err) {
//       console.error("Error deleting old products:", err);
//     }
//   });
// };

// module.exports = deleteOldProductsJob;



const Product = require("../models/Product");
const supabase = require("../config/supabase");

const deleteOldProductsJob = async () => {
  try {
    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - 30));

    // Find all non-featured products older than 30 days
    const productsToDelete = await Product.find({
      featured: false,
      createdAt: { $lte: cutoffDate },
    });

    if (!productsToDelete.length) {
      console.log("No old non-featured products to delete.");
      return 0;
    }

    // Delete images from Supabase
    for (const product of productsToDelete) {
      if (product.image) {
        try {
          const url = new URL(product.image);
          const path = url.pathname.split("/").slice(5).join("/");

          const { error } = await supabase.storage
            .from("manddi")
            .remove([path]);

          if (error) {
            console.error(
              `Failed to delete image for product ${product._id}:`,
              error.message
            );
          } else {
            console.log(`Deleted image for product ${product._id}`);
          }
        } catch (err) {
          console.error(
            `Invalid image URL for product ${product._id}`,
            err.message
          );
        }
      }
    }

    // Delete products from DB
    const { deletedCount } = await Product.deleteMany({
      _id: { $in: productsToDelete.map((p) => p._id) },
    });

    console.log(`Deleted ${deletedCount} old non-featured products.`);

    return deletedCount;
  } catch (err) {
    console.error("Error deleting old products:", err);
    throw err;
  }
};

module.exports = deleteOldProductsJob;

