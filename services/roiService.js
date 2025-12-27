const mongoose = require("mongoose")
const User = require("../models/User")
const Investment = require("../models/Investment")
const ROIHistory = require("../models/ROIHistory")
const LevelIncome = require("../models/LevelIncome")
const Referral = require("../models/Referral")

// Investment plan configurations
const INVESTMENT_PLANS = {
  SILVER: {
    roiRate: 0.02, // 2% daily
    duration: 180, // 180 days
    minAmount: 1000,
    maxAmount: 50000,
  },
  GOLD: {
    roiRate: 0.025, // 2.5% daily
    duration: 200, // 200 days
    minAmount: 50000,
    maxAmount: 200000,
  },
  PLATINUM: {
    roiRate: 0.03, // 3% daily
    duration: 365, // 365 days
    minAmount: 200000,
    maxAmount: 1000000,
  },
}

// Level income percentages
const LEVEL_PERCENTAGES = [0.1, 0.05, 0.03, 0.02, 0.01] // 10%, 5%, 3%, 2%, 1%

class ROIService {
  // Calculate daily ROI for all active investments
  static async calculateDailyROI() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get all active investments that need ROI calculation
      const activeInvestments = await Investment.find({
        status: "ACTIVE",
        endDate: { $gt: today },
        $or: [
          { lastROIUpdate: { $lt: today } },
          { lastROIUpdate: null },
        ],
      }).populate("userId")

      console.log(`Processing ${activeInvestments.length} active investments`)

      for (const investment of activeInvestments) {
        await this.processInvestmentROI(investment, today)
      }

      return { success: true, processed: activeInvestments.length }
    } catch (error) {
      console.error("Error calculating daily ROI:", error)
      return { success: false, error: error.message }
    }
  }

  // Process ROI for a single investment
  static async processInvestmentROI(investment, date) {
    try {
      const dailyROI = investment.amount * investment.roiRate
      
      // Update investment ROI
      investment.totalROIEarned += dailyROI
      investment.lastROIUpdate = date
      await investment.save()

      // Update user balance
      const user = investment.userId
      user.totalROI += dailyROI
      user.totalBalance += dailyROI
      user.lastROIUpdate = date
      await user.save()

      // Create ROI history record
      await ROIHistory.create({
        userId: user._id,
        investmentId: investment._id,
        amount: dailyROI,
        date: date,
        type: "DAILY_ROI",
      })

      // Calculate level income for referrers
      await this.calculateLevelIncome(user._id, investment.amount, investment._id, date)

      console.log(`Processed ROI for investment ${investment._id}: $${dailyROI}`)
    } catch (error) {
      console.error(`Error processing investment ${investment._id}:`, error)
      throw error
    }
  }

  // Calculate level income based on referral hierarchy
  static async calculateLevelIncome(userId, investmentAmount, investmentId, date) {
    try {
      let currentUserId = userId
      let level = 1

      while (currentUserId && level <= LEVEL_PERCENTAGES.length) {
        const user = await User.findById(currentUserId).populate("referrerId")
        
        if (!user.referrerId) break

        const referrer = user.referrerId
        const levelPercentage = LEVEL_PERCENTAGES[level - 1]
        const levelIncomeAmount = investmentAmount * levelPercentage

        // Update referrer's level income
        referrer.totalLevelIncome += levelIncomeAmount
        referrer.totalBalance += levelIncomeAmount
        await referrer.save()

        // Create level income record
        await LevelIncome.create({
          userId: referrer._id,
          fromUserId: currentUserId,
          level: level,
          percentage: levelPercentage * 100,
          amount: levelIncomeAmount,
          investmentId: investmentId,
          type: "LEVEL",
        })

        // Create or update referral record
        await Referral.findOneAndUpdate(
          { userId: referrer._id, referredUserId: currentUserId },
          {
            $inc: { directInvestmentAmount: investmentAmount, levelIncome: levelIncomeAmount },
            level: level,
          },
          { upsert: true, new: true }
        )

        currentUserId = referrer._id
        level++
      }
    } catch (error) {
      console.error("Error calculating level income:", error)
      throw error
    }
  }

  // Get investment plan details
  static getPlanDetails(planName) {
    return INVESTMENT_PLANS[planName]
  }

  // Validate investment amount for plan
  static validateInvestmentAmount(planName, amount) {
    const plan = INVESTMENT_PLANS[planName]
    if (!plan) return { valid: false, error: "Invalid plan" }
    
    if (amount < plan.minAmount) {
      return { valid: false, error: `Minimum amount for ${planName} is $${plan.minAmount}` }
    }
    
    if (amount > plan.maxAmount) {
      return { valid: false, error: `Maximum amount for ${planName} is $${plan.maxAmount}` }
    }
    
    return { valid: true }
  }

  // Calculate expected returns
  static calculateExpectedReturns(amount, planName) {
    const plan = INVESTMENT_PLANS[planName]
    if (!plan) return null

    const dailyROI = amount * plan.roiRate
    const totalROI = dailyROI * plan.duration
    const maturityAmount = amount + totalROI

    return {
      dailyROI,
      totalROI,
      maturityAmount,
      duration: plan.duration,
      roiRate: plan.roiRate,
    }
  }

  // Process investment maturity
  static async processMaturity(investmentId) {
    try {
      const investment = await Investment.findById(investmentId).populate("userId")
      if (!investment || investment.status !== "ACTIVE") {
        throw new Error("Invalid investment")
      }

      const user = investment.userId
      const maturityAmount = investment.amount + investment.totalROIEarned

      // Update investment status
      investment.status = "COMPLETED"
      await investment.save()

      // Update user stats
      user.activeInvestments -= 1
      user.totalBalance += investment.amount // Return principal
      await user.save()

      // Create maturity record
      await ROIHistory.create({
        userId: user._id,
        investmentId: investment._id,
        amount: investment.amount,
        date: new Date(),
        type: "MATURITY",
      })

      return { success: true, maturityAmount }
    } catch (error) {
      console.error("Error processing maturity:", error)
      throw error
    }
  }
}

module.exports = ROIService
