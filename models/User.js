const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: "",
    },
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    totalBalance: {
      type: Number,
      default: 0,
    },
    totalROI: {
      type: Number,
      default: 0,
    },
    totalLevelIncome: {
      type: Number,
      default: 0,
    },
    totalInvestments: {
      type: Number,
      default: 0,
    },
    activeInvestments: {
      type: Number,
      default: 0,
    },
    withdrawalAmount: {
      type: Number,
      default: 0,
    },
    lastROIUpdate: {
      type: Date,
      default: null,
    },
    kyc: {
      verified: { type: Boolean, default: false },
      pan: String,
      adhaar: String,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("User", userSchema)
