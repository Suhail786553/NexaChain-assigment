const mongoose = require("mongoose")
const User = require("./models/User")
const Investment = require("./models/Investment")
require("dotenv").config()

// Test data creation script
async function createTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mern-investment")
    console.log("Connected to MongoDB")

    // Create main user if not exists
    let mainUser = await User.findOne({ email: "main@example.com" })
    if (!mainUser) {
      mainUser = new User({
        username: "mainuser",
        email: "main@example.com",
        password: "password123"
      })
      await mainUser.save()
      console.log("Created main user:", mainUser.referralCode)
    }

    // Create some referral users
    const referralUsers = [
      { username: "referral1", email: "referral1@example.com", password: "password123" },
      { username: "referral2", email: "referral2@example.com", password: "password123" },
      { username: "referral3", email: "referral3@example.com", password: "password123" }
    ]

    for (let i = 0; i < referralUsers.length; i++) {
      let user = await User.findOne({ email: referralUsers[i].email })
      if (!user) {
        user = new User({
          ...referralUsers[i],
          referrerId: mainUser._id
        })
        await user.save()
        console.log(`Created referral user ${i + 1}:`, user.referralCode)

        // Create an investment for each referral
        const investment = new Investment({
          userId: user._id,
          amount: 5000 + (i * 2000),
          plan: "SILVER",
          roiRate: 0.02,
          duration: 180,
          dailyROI: (5000 + (i * 2000)) * 0.02,
          maturityAmount: (5000 + (i * 2000)) * (1 + 0.02 * 180)
        })
        await investment.save()
        console.log(`Created investment for ${user.username}`)
      }
    }

    console.log("Test data created successfully!")
    console.log("Main user referral code:", mainUser.referralCode)
    console.log("Login with main@example.com / password123")

  } catch (error) {
    console.error("Error creating test data:", error)
  } finally {
    await mongoose.disconnect()
  }
}

createTestData()
