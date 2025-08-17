const express = require('express')
const multer = require('multer');

const Product = require('../models/Product');
const uploadImageToSupabase = require('../utils/UploadSupabase');
const compressToProductSize = require('../utils/FileValidator');
const { default: mongoose } = require('mongoose');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router()


// Multer setup (in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Post Product/ad

router.post('/', upload.single('image'), async(req, res) => {
  
  try {
    const  {
      userId,
        title,
        details,
        category,
        price,
        province,
        district,
        tehsil,
        area,
        phone, 
        whatsapp
    } = req.body
    
    let imageUrl = null

    if (req.file) {
  const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
  const compressedBuffer = await compressToProductSize(req.file.buffer, req.file.mimetype);
  imageUrl = await uploadImageToSupabase(compressedBuffer, fileName);
}

    const product = new Product({
      userId,
         title,
        details,
        category,
        price,
        province,
        district,
        tehsil,
        area,
        phone, 
        whatsapp,
        image:imageUrl
    })
    await product.save()
    res.status(200).json({message:'Product uploaded successfully'})
  } catch (error) {
    console.log(error)
    res.status(500).json({error:'Failded to upload product'})
  }
})

// Get all products

router.get('/', async (req, res) => {
  try {
    const {
      id,
      category,
      province,
      district,
      tehsil,
      area,
      keyword,
      
    } = req.query;
    const filters = [];
    // Convert string ID to ObjectId if present
    if (id) {
      filters.push({ _id: new mongoose.Types.ObjectId(id) });
    }

    // Optional filters
    if (category) filters.push({ category });
    if (province) filters.push({ province });
    if (district) filters.push({ district });
    if (tehsil) filters.push({ tehsil });
    if (area) filters.push({ area });

    // Keyword search (can be expanded)
    if (keyword) {
      filters.push({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
        ],
      });
    }

    const matchStage = filters.length > 0 ? { $and: filters } : {};

   const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const pipeline = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          totalCount: [{ $count: 'count' }],
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
        },
      },
    ];

    const result = await Product.aggregate(pipeline);
    const total = result[0]?.totalCount[0]?.count || 0;
    const data = result[0]?.data || [];

    if (total === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    res.json({ total, data });
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({ error: 'Server error while fetching products' });
  }
});

// Get a user ads
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const matchStage = {
      userId: id
    };
    const pipeline = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          totalCount: [{ $count: 'count' }],
          data: [
            { $skip: skip },
            { $limit: limit }
          ]
        }
      }
    ];

    const result = await Product.aggregate(pipeline);
    const total = result[0]?.totalCount[0]?.count || 0;
    const data = result[0]?.data || [];

    if (total === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    res.json({ total, data });

  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({ error: 'Server error while fetching products' });
  }
});

module.exports = router