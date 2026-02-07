const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
       required: function () {
        return this.provider === "local";
      },
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },

    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple nulls
    },

    role: {
      type: String,
      default: "user",
    },

    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
