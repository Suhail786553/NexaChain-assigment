const express = require("express")
const auth = require("../middleware/auth")
const User = require("../models/User")
const Investment = require("../models/Investment")
const Referral = require("../models/Referral")
const LevelIncome = require("../models/LevelIncome")

const router = express.Router()

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      message: "Profile fetched successfully",
      user,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get user dashboard
router.get("/dashboard", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password")

    // For demo user, return sample data
    if (user.email === "test@example.com") {
      console.log("Returning sample data for test user")
      return res.json({
        message: "Dashboard data fetched successfully",
        data: {
          user: {
            ...user.toObject(),
            totalBalance: 15000,
            totalROI: 3200,
            totalLevelIncome: 800,
            totalInvestments: 2,
            activeInvestments: 1,
          },
          investments: {
            total: 2,
            active: 1,
            completed: 1,
            totalAmount: 10000,
            activeAmount: 5000,
            list: [
              {
                _id: "inv1",
                userId: user._id,
                amount: 5000,
                plan: "SILVER",
                roiRate: 0.02,
                duration: 180,
                dailyROI: 100,
                maturityAmount: 14000,
                status: "ACTIVE",
                totalROIEarned: 3000,
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
              {
                _id: "inv2",
                userId: user._id,
                amount: 5000,
                plan: "SILVER",
                roiRate: 0.02,
                duration: 180,
                dailyROI: 100,
                maturityAmount: 14000,
                status: "COMPLETED",
                totalROIEarned: 3000,
                startDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
              }
            ]
          },
          roi: {
            total: 3200,
            dailyAverage: 106.67,
            recent: Array.from({ length: 10 }, (_, i) => ({
              _id: `roi${i}`,
              userId: user._id,
              amount: 100,
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
              investmentId: "inv1",
              type: "daily",
            }))
          },
          levelIncome: {
            total: 800,
            byLevel: { "1": 800 },
            recent: [
              {
                _id: "level1",
                userId: user._id,
                amount: 800,
                level: 1,
                fromUserId: user._id,
                investmentId: "inv1",
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
              }
            ]
          },
          referrals: {
            direct: 3,
            total: 8,
          },
          balance: {
            total: 15000,
            available: 10000,
            invested: 5000
          }
        },
      })
    }

    // Get investments with statistics
    const investments = await Investment.find({ userId: req.userId })
    const activeInvestments = investments.filter(inv => inv.status === "ACTIVE")
    const completedInvestments = investments.filter(inv => inv.status === "COMPLETED")
    
    const totalInvestedAmount = investments.reduce((sum, inv) => sum + inv.amount, 0)
    const totalActiveAmount = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0)

    // Get level income with breakdown by level
    const levelIncome = await LevelIncome.find({ userId: req.userId }).sort({ createdAt: -1 })
    const totalLevelIncome = levelIncome.reduce((sum, income) => sum + income.amount, 0)
    
    const levelIncomeByLevel = {}
    levelIncome.forEach(income => {
      if (!levelIncomeByLevel[income.level]) {
        levelIncomeByLevel[income.level] = 0
      }
      levelIncomeByLevel[income.level] += income.amount
    })

    // Get recent ROI history
    const ROIHistory = require("../models/ROIHistory")
    const recentROI = await ROIHistory.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(10)

    // Get referral statistics
    const directReferrals = await User.countDocuments({ referrerId: req.userId })
    const totalReferrals = await User.countDocuments({ referrerId: { $in: await getAllReferralIds(req.userId) } })

    // Calculate daily averages
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last30DaysROI = recentROI.filter(roi => new Date(roi.date) >= thirtyDaysAgo)
    const dailyAverageROI = last30DaysROI.length > 0 
      ? last30DaysROI.reduce((sum, roi) => sum + roi.amount, 0) / 30 
      : 0

    res.json({
      message: "Dashboard data fetched successfully",
      data: {
        user,
        investments: {
          total: investments.length,
          active: activeInvestments.length,
          completed: completedInvestments.length,
          totalAmount: totalInvestedAmount,
          activeAmount: totalActiveAmount,
          list: investments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        },
        roi: {
          total: user.totalROI,
          dailyAverage: dailyAverageROI,
          recent: recentROI
        },
        levelIncome: {
          total: totalLevelIncome,
          byLevel: levelIncomeByLevel,
          recent: levelIncome.slice(0, 10)
        },
        referrals: {
          direct: directReferrals,
          total: totalReferrals,
        },
        balance: {
          total: user.totalBalance,
          available: user.totalBalance - totalActiveAmount,
          invested: totalActiveAmount
        }
      },
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Helper function to get all referral IDs recursively
async function getAllReferralIds(userId) {
  const directReferrals = await User.find({ referrerId: userId }).select('_id')
  const allIds = directReferrals.map(ref => ref._id)
  
  for (const ref of directReferrals) {
    const indirectReferrals = await getAllReferralIds(ref._id)
    allIds.push(...indirectReferrals)
  }
  
  return allIds
}

// Get referral tree
router.get("/referral-tree", auth, async (req, res) => {
  try {
    console.log(`Building referral tree for user: ${req.userId}`)
    
    const buildReferralTree = async (userId, level = 0, maxLevels = 5) => {
      if (level > maxLevels) return null

      const user = await User.findById(userId).select("username email referralCode")
      if (!user) {
        console.log(`User not found: ${userId}`)
        return null
      }

      const referrals = await User.find({ referrerId: userId }).select("username email")
      console.log(`Found ${referrals.length} direct referrals for user ${userId}`)

      const children = await Promise.all(
        referrals.map(async (ref) => {
          const childTree = await buildReferralTree(ref._id, level + 1, maxLevels)
          return childTree
        })
      )

      return {
        id: userId,
        name: user.username,
        email: user.email,
        referralCode: user.referralCode,
        level,
        children: children.filter((c) => c !== null),
      }
    }

    const tree = await buildReferralTree(req.userId)
    console.log(`Referral tree built successfully. Root has ${tree?.children?.length || 0} direct referrals`)

    res.json({
      message: "Referral tree fetched successfully",
      tree,
    })
  } catch (error) {
    console.error("Error fetching referral tree:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get referral stats
router.get("/referral-stats", auth, async (req, res) => {
  try {
    const directReferrals = await User.find({ referrerId: req.userId })

    const referralsData = await Promise.all(
      directReferrals.map(async (ref) => {
        const investments = await Investment.find({ userId: ref._id })
        const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0)
        return {
          userId: ref._id,
          username: ref.username,
          email: ref.email,
          totalInvestment,
        }
      }),
    )

    res.json({
      message: "Referral stats fetched successfully",
      directReferrals: referralsData,
      totalDirectReferrals: directReferrals.length,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
