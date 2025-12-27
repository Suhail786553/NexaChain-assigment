const express = require("express")
const auth = require("../middleware/auth")
const ROIHistory = require("../models/ROIHistory")
const User = require("../models/User")
const Investment = require("../models/Investment")
const LevelIncome = require("../models/LevelIncome")
const { triggerDailyROI, getStatus } = require("../services/scheduler")

const router = express.Router()

// Get ROI summary
router.get("/summary", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)

    // Get monthly ROI breakdown
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const roiHistory = await ROIHistory.aggregate([
      {
        $match: {
          userId: user._id,
          date: { $gte: sixMonthsAgo },
          type: "DAILY_ROI",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])

    // Get level income breakdown
    const levelIncomeHistory = await LevelIncome.aggregate([
      {
        $match: {
          userId: user._id,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])

    res.json({
      message: "ROI summary fetched successfully",
      data: {
        totalROI: user.totalROI,
        totalLevelIncome: user.totalLevelIncome,
        totalBalance: user.totalBalance,
        monthlyROIBreakdown: roiHistory,
        monthlyLevelIncomeBreakdown: levelIncomeHistory,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get ROI history
router.get("/history", auth, async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query

    const roiHistory = await ROIHistory.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(Number.parseInt(limit))
      .skip(Number.parseInt(skip))
      .populate("investmentId", "plan amount")

    const total = await ROIHistory.countDocuments({ userId: req.userId })

    res.json({
      message: "ROI history fetched successfully",
      roiHistory,
      total,
      limit: Number.parseInt(limit),
      skip: Number.parseInt(skip),
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get investment performance
router.get("/performance", auth, async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.userId })

    const performance = investments.map((inv) => ({
      id: inv._id,
      plan: inv.plan,
      amount: inv.amount,
      dailyROI: inv.dailyROI,
      totalROIEarned: inv.totalROIEarned,
      maturityAmount: inv.maturityAmount,
      status: inv.status,
      daysCompleted: Math.floor((new Date() - inv.startDate) / (1000 * 60 * 60 * 24)),
      roi_percentage: ((inv.totalROIEarned / inv.amount) * 100).toFixed(2),
    }))

    res.json({
      message: "Investment performance fetched successfully",
      performance,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Admin endpoint to trigger manual ROI calculation
router.post("/calculate-daily", auth, async (req, res) => {
  try {
    // In a real app, you'd check if user is admin here
    const result = await triggerDailyROI()
    res.json({
      message: "Manual ROI calculation triggered",
      result,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get scheduler status
router.get("/scheduler-status", auth, async (req, res) => {
  try {
    const status = getStatus()
    res.json({
      message: "Scheduler status fetched successfully",
      status,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
