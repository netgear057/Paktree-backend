const express = require('express');

const dotenv = require('dotenv');
const Stripe = require('stripe');
const bodyParser = require('body-parser');
const  Post = require('../models/Product'); // your posts schema
const router = express.Router();

dotenv.config();
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


// 2️⃣ Webhook to handle successful payments
router.post(
  "/",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body, // Buffer here
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.sendStatus(400);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { postId } = session.metadata;

      try {
        await Post.findByIdAndUpdate(postId, {
          featured: true,
          featuredExpiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day
        });
        console.log(`✅ Post ${postId} marked as featured`);
      } catch (err) {
        console.error(`❌ Failed to update post ${postId}:`, err);
      }
    }

    res.json({ received: true });
  }
);

module.exports = router