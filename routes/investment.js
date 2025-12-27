const express = require("express")
const auth = require("../middleware/auth")
const Investment = require("../models/Investment")
const User = require("../models/User")
const ROIService = require("../services/roiService")

const router = express.Router()

// Create new investment
router.post("/create", auth, async (req, res) => {
  try {
    const { amount, plan } = req.body

    // Validation
    if (!amount || !plan) {
      return res.status(400).json({ message: "Please provide amount and plan" })
    }

    if (!["SILVER", "GOLD", "PLATINUM"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan" })
    }

    // Validate investment amount for plan
    const validation = ROIService.validateInvestmentAmount(plan, parseFloat(amount))
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Get plan details
    const planDetails = ROIService.getPlanDetails(plan)
    const expectedReturns = ROIService.calculateExpectedReturns(parseFloat(amount), plan)

    // Calculate dates
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + planDetails.duration * 24 * 60 * 60 * 1000)

    // Create investment
    const newInvestment = new Investment({
      userId: req.userId,
      amount: parseFloat(amount),
      plan,
      roiRate: planDetails.roiRate,
      duration: planDetails.duration,
      startDate,
      endDate,
      dailyROI: expectedReturns.dailyROI,
      maturityAmount: expectedReturns.maturityAmount,
    })

    await newInvestment.save()

    // Update user stats
    user.totalInvestments += 1
    user.activeInvestments += 1
    user.totalBalance += parseFloat(amount)
    await user.save()

    res.status(201).json({
      message: "Investment created successfully",
      investment: newInvestment,
      expectedReturns,
    })
  } catch (error) {
    console.error("Investment creation error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all investments
router.get("/", auth, async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.userId })
      .sort({ createdAt: -1 })

    res.json({
      message: "Investments fetched successfully",
      investments,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get investment plans
router.get("/plans", auth, async (req, res) => {
  try {
    const plans = {
      SILVER: ROIService.getPlanDetails("SILVER"),
      GOLD: ROIService.getPlanDetails("GOLD"),
      PLATINUM: ROIService.getPlanDetails("PLATINUM"),
    }

    res.json({
      message: "Investment plans fetched successfully",
      plans,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Calculate expected returns
router.post("/calculate", auth, async (req, res) => {
  try {
    const { amount, plan } = req.body

    if (!amount || !plan) {
      return res.status(400).json({ message: "Please provide amount and plan" })
    }

    const validation = ROIService.validateInvestmentAmount(plan, parseFloat(amount))
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error })
    }

    const expectedReturns = ROIService.calculateExpectedReturns(parseFloat(amount), plan)

    res.json({
      message: "Expected returns calculated successfully",
      expectedReturns,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get investment details
router.get("/:id", auth, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id)

    if (!investment) {
      return res.status(404).json({ message: "Investment not found" })
    }

    if (investment.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" })
    }

    res.json({
      message: "Investment fetched successfully",
      investment,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get investment ROI history
router.get("/:id/roi-history", auth, async (req, res) => {
  try {
    const roiHistory = await ROIHistory.find({
      investmentId: req.params.id,
    }).sort({ date: -1 })

    res.json({
      message: "ROI history fetched successfully",
      roiHistory,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
