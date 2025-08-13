const express = require('express');

const dotenv = require('dotenv');
const Stripe = require('stripe');
const bodyParser = require('body-parser');
const  Post = require('../models/Product'); // your posts schema
const router = express.Router();

dotenv.config();
const app = express();
app.use(bodyParser.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 1️⃣ Create Checkout Session
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { postId, userId } = req.body;

    // Validate that post belongs to user
    const post = await Post.findOne({ _id: postId, userId });
    if (!post) return res.status(404).json({ error: "Post not found" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "pkr", // Pakistani Rupees
          product_data: { name: `Feature Ad: ${post.title}` },
          unit_amount: 500 * 100, // 500 PKR in paisa
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-success`,
      metadata: {
        postId: postId,
        userId: userId,
      }
    });
    res.json({ url: session.url});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payment session error" });
  }
});





module.exports = router