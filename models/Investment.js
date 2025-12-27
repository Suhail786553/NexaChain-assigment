const mongoose = require("mongoose")

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    plan: {
      type: String,
      enum: ["SILVER", "GOLD", "PLATINUM"],
      required: true,
    },
    roiRate: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number, // in days
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "CANCELLED"],
      default: "ACTIVE",
    },
    dailyROI: {
      type: Number,
      default: 0,
    },
    totalROIEarned: {
      type: Number,
      default: 0,
    },
    maturityAmount: {
      type: Number,
      default: 0,
    },
    lastROIUpdate: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Investment", investmentSchema)
