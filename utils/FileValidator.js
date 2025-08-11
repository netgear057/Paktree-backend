const sharp = require("sharp");

/**
 * Compress image to ~300KB max by resizing and adjusting quality
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @returns {Promise<Buffer>}
 */
const compressToProductSize = async (buffer, mimetype) => {
  const maxSizeKB = 300;
  let quality = 80;
  let compressed = buffer;

  const resizeImage = async (qualityLevel) => {
    const image = sharp(buffer).resize({ width: 1024 });

    if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
      return await image.jpeg({ quality: qualityLevel }).toBuffer();
    } else if (mimetype === "image/png") {
      return await image.png({ quality: qualityLevel, compressionLevel: 9 }).toBuffer();
    } else if (mimetype === "image/webp") {
      return await image.webp({ quality: qualityLevel }).toBuffer();
    } else {
      return buffer; // unsupported types
    }
  };

  for (let q = quality; q >= 30; q -= 10) {
    compressed = await resizeImage(q);
    const sizeKB = compressed.length / 1024;
    if (sizeKB <= maxSizeKB) {
      return compressed;
    }
  }

  // Return lowest quality if nothing hits below threshold
  return compressed;
};
module.exports= compressToProductSize