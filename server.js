const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const { initializeScheduler } = require("./services/scheduler")

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mern-investment")
  .then(() => {
    console.log("[Database] MongoDB connected successfully")
  })
  .catch((error) => {
    console.error("[Database] MongoDB connection error:", error)
    process.exit(1)
  })

// Initialize scheduler
initializeScheduler()

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/users", require("./routes/user"))
app.use("/api/investments", require("./routes/investment"))
app.use("/api/roi", require("./routes/roi"))

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date(),
    message: "Server is running",
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[Error]", err)
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`)
})
