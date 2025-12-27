const mongoose = require("mongoose")

const levelIncomeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    investmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
    },
    type: {
      type: String,
      enum: ["DIRECT", "LEVEL"],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("LevelIncome", levelIncomeSchema)
