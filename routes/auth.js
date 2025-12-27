const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")

const router = express.Router()

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" })
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with simple approach
    const referralCode = "REF" + Math.random().toString(36).substring(2, 10).toUpperCase()
    
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      referralCode,
      totalBalance: 0,
      totalROI: 0,
      totalLevelIncome: 0,
      totalInvestments: 0,
      activeInvestments: 0,
    })

    // Generate token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || "secret_key", { expiresIn: "30d" })

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        referralCode: newUser.referralCode,
        totalBalance: newUser.totalBalance,
        totalROI: newUser.totalROI,
        totalLevelIncome: newUser.totalLevelIncome,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" })
    }

    // For demo: if email is test@example.com, create user if not exists
    if (email === "test@example.com" && password === "password123") {
      let user = await User.findOne({ email })
      if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10)
        user = await User.create({
          username: "testuser",
          email,
          password: hashedPassword,
          referralCode: "TEST123",
          totalBalance: 15000,
          totalROI: 3200,
          totalLevelIncome: 800,
          totalInvestments: 2,
          activeInvestments: 1,
        })
      }

      // Always update user with sample data for demo
      await User.findByIdAndUpdate(user._id, {
        totalBalance: 15000,
        totalROI: 3200,
        totalLevelIncome: 800,
        totalInvestments: 2,
        activeInvestments: 1,
      })

      // Create sample investments if they don't exist
      const Investment = require("../models/Investment")
      const ROIHistory = require("../models/ROIHistory")
      const LevelIncome = require("../models/LevelIncome")

      const existingInvestment = await Investment.findOne({ userId: user._id })
      if (!existingInvestment) {
        // Create sample investment
        await Investment.create({
          userId: user._id,
          amount: 5000,
          plan: "SILVER",
          roiRate: 0.02,
          duration: 180,
          dailyROI: 100,
          maturityAmount: 14000,
          status: "ACTIVE",
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
          totalROIEarned: 3000,
        })

        // Create sample ROI history
        for (let i = 0; i < 10; i++) {
          await ROIHistory.create({
            userId: user._id,
            amount: 100,
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
            investmentId: user._id,
            type: "daily",
          })
        }

        // Create sample level income
        await LevelIncome.create({
          userId: user._id,
          amount: 800,
          level: 1,
          fromUserId: user._id,
          investmentId: user._id,
        })
      }

      // Get updated user data
      user = await User.findById(user._id)

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret_key", { expiresIn: "30d" })

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          referralCode: user.referralCode,
          totalBalance: user.totalBalance,
          totalROI: user.totalROI,
          totalLevelIncome: user.totalLevelIncome,
          totalInvestments: user.totalInvestments,
          activeInvestments: user.activeInvestments,
        },
      })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret_key", { expiresIn: "30d" })

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        referralCode: user.referralCode,
        totalBalance: user.totalBalance,
        totalROI: user.totalROI,
        totalLevelIncome: user.totalLevelIncome,
        totalInvestments: user.totalInvestments,
        activeInvestments: user.activeInvestments,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
