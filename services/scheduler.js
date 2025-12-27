const cron = require("node-cron")
const ROIService = require("./roiService")

let schedulerStarted = false
let isRunning = false
let lastRun = null

/**
 * Initialize the scheduler with enhanced features
 * Runs ROI calculation daily at 00:00 (midnight UTC)
 */
function initializeScheduler() {
  if (schedulerStarted) {
    console.log("[Scheduler] Scheduler already running")
    return
  }

  // Run at midnight (00:00) every day UTC
  const dailyROIJob = cron.schedule("0 0 * * *", async () => {
    if (isRunning) {
      console.log("[Scheduler] ROI calculation already running, skipping...")
      return
    }

    isRunning = true
    const startTime = new Date()
    console.log("[Scheduler] Starting daily ROI calculation at", startTime.toISOString())

    try {
      const result = await ROIService.calculateDailyROI()
      lastRun = startTime
      
      if (result.success) {
        console.log("[Scheduler] Daily ROI calculation completed successfully")
        console.log(`[Scheduler] Processed ${result.processed} investments`)
        console.log(`[Scheduler] Duration: ${Date.now() - startTime.getTime()}ms`)
      } else {
        console.error("[Scheduler] Daily ROI calculation failed:", result.error)
      }
    } catch (error) {
      console.error("[Scheduler] Critical error in daily ROI calculation:", error)
    } finally {
      isRunning = false
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  })

  // Run investment completion check at 00:30 every day
  const completeInvestmentsJob = cron.schedule("30 0 * * *", async () => {
    console.log("[Scheduler] Starting matured investments completion at", new Date().toISOString())
    try {
      await updateMaturedInvestments()
      console.log("[Scheduler] Matured investments completion completed")
    } catch (error) {
      console.error("[Scheduler] Error in investments completion:", error)
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  })

  // Cleanup job at 2 AM on Sundays
  const cleanupJob = cron.schedule("0 2 * * 0", async () => {
    console.log("[Scheduler] Starting weekly cleanup at", new Date().toISOString())
    try {
      await cleanupOldRecords()
      console.log("[Scheduler] Weekly cleanup completed")
    } catch (error) {
      console.error("[Scheduler] Error in cleanup:", error)
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  })

  schedulerStarted = true
  console.log("[Scheduler] Scheduler initialized and running")
  console.log("[Scheduler] Schedule:")
  console.log("  - Daily ROI: 00:00 UTC")
  console.log("  - Investment Maturity: 00:30 UTC")
  console.log("  - Weekly Cleanup: 02:00 UTC (Sundays)")

  return { dailyROIJob, completeInvestmentsJob, cleanupJob }
}

/**
 * Update matured investments
 */
async function updateMaturedInvestments() {
  const Investment = require("../models/Investment")
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const maturedInvestments = await Investment.find({
    status: "ACTIVE",
    endDate: { $lte: today }
  })

  console.log(`[Scheduler] Found ${maturedInvestments.length} matured investments`)

  for (const investment of maturedInvestments) {
    try {
      await ROIService.processMaturity(investment._id)
      console.log(`[Scheduler] Processed maturity for investment ${investment._id}`)
    } catch (error) {
      console.error(`[Scheduler] Failed to process maturity for investment ${investment._id}:`, error)
    }
  }
}

/**
 * Clean up old records (older than 1 year)
 */
async function cleanupOldRecords() {
  const ROIHistory = require("../models/ROIHistory")
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const deletedCount = await ROIHistory.deleteMany({
    date: { $lt: oneYearAgo },
    type: "DAILY_ROI"
  })

  console.log(`[Scheduler] Cleaned up ${deletedCount.deletedCount} old ROI records`)
}

/**
 * Manual trigger for daily ROI (for testing/emergency)
 */
async function triggerDailyROI() {
  console.log("[Scheduler] Manual trigger for daily ROI calculation")
  if (isRunning) {
    console.log("[Scheduler] ROI calculation already running")
    return { success: false, message: "Already running" }
  }

  isRunning = true
  const startTime = new Date()
  
  try {
    const result = await ROIService.calculateDailyROI()
    lastRun = startTime
    return result
  } catch (error) {
    console.error("[Scheduler] Manual ROI calculation failed:", error)
    return { success: false, error: error.message }
  } finally {
    isRunning = false
  }
}

/**
 * Get scheduler status
 */
function getStatus() {
  return {
    isRunning,
    schedulerStarted,
    lastRun,
    uptime: process.uptime(),
    nextRun: getNextRunTime()
  }
}

/**
 * Get next scheduled run time
 */
function getNextRunTime() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow
}

/**
 * Stop the scheduler (useful for testing or graceful shutdown)
 */
function stopScheduler() {
  if (!schedulerStarted) {
    console.log("[Scheduler] Scheduler is not running")
    return
  }

  console.log("[Scheduler] Stopping scheduler")
  cron.getTasks().forEach(task => task.stop())
  schedulerStarted = false
  isRunning = false
}

module.exports = {
  initializeScheduler,
  stopScheduler,
  triggerDailyROI,
  getStatus,
  updateMaturedInvestments,
  cleanupOldRecords
}
