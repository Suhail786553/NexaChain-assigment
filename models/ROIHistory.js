const mongoose = require("mongoose")

const roiHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    investmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ["DAILY_ROI", "MATURITY"],
      required: true,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("ROIHistory", roiHistorySchema)
