const Investment = require("../models/Investment")
const User = require("../models/User")
const ROIHistory = require("../models/ROIHistory")
const { PLAN_ROI_RATES } = require("./constants")

/**
 * Calculate daily ROI for all active investments
 * Called by cron job at midnight
 */
async function calculateDailyROI() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find all active investments
    const activeInvestments = await Investment.find({
      status: "ACTIVE",
      endDate: { $gt: new Date() },
    })

    console.log(`[ROI Calculator] Processing ${activeInvestments.length} active investments`)

    for (const investment of activeInvestments) {
      // Calculate daily ROI
      const dailyROI = (investment.amount * PLAN_ROI_RATES[investment.plan]) / 100

      // Update investment
      investment.totalROIEarned += dailyROI
      investment.maturityAmount = investment.amount + investment.totalROIEarned
      await investment.save()

      // Create ROI history entry
      const roiHistory = new ROIHistory({
        userId: investment.userId,
        investmentId: investment._id,
        amount: dailyROI,
        date: today,
        type: "DAILY_ROI",
      })
      await roiHistory.save()

      // Update user total ROI
      const user = await User.findById(investment.userId)
      user.totalROI += dailyROI
      await user.save()

      console.log(`[ROI Calculator] Updated investment ${investment._id} with ROI: ${dailyROI}`)
    }

    console.log(`[ROI Calculator] Daily ROI calculation completed`)
    return { success: true, processed: activeInvestments.length }
  } catch (error) {
    console.error("[ROI Calculator] Error:", error)
    throw error
  }
}

/**
 * Complete investment when end date is reached
 */
async function completeMaturedInvestments() {
  try {
    const now = new Date()

    const maturedInvestments = await Investment.find({
      status: "ACTIVE",
      endDate: { $lte: now },
    })

    console.log(`[Investment Completion] Processing ${maturedInvestments.length} matured investments`)

    for (const investment of maturedInvestments) {
      investment.status = "COMPLETED"
      await investment.save()

      // Create maturity ROI history
      const roiHistory = new ROIHistory({
        userId: investment.userId,
        investmentId: investment._id,
        amount: investment.maturityAmount,
        type: "MATURITY",
      })
      await roiHistory.save()

      console.log(`[Investment Completion] Completed investment ${investment._id}`)
    }

    return { success: true, completed: maturedInvestments.length }
  } catch (error) {
    console.error("[Investment Completion] Error:", error)
    throw error
  }
}

module.exports = {
  calculateDailyROI,
  completeMaturedInvestments,
}
