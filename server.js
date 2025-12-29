const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const { initializeScheduler } = require("./services/scheduler")
const next = require("next")

dotenv.config()

const dev = process.env.NODE_ENV !== "production"
const nextApp = next({ dev })
const handle = nextApp.getRequestHandler()

nextApp.prepare().then(() => {
  const expressApp = express()

  // Middleware
  expressApp.use(cors())
  expressApp.use(express.json())

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
  expressApp.use("/api/auth", require("./routes/auth"))
  expressApp.use("/api/users", require("./routes/user"))
  expressApp.use("/api/investments", require("./routes/investment"))
  expressApp.use("/api/roi", require("./routes/roi"))

  // Health check
  expressApp.get("/api/health", (req, res) => {
    res.json({
      status: "OK",
      timestamp: new Date(),
      message: "Server is running",
    })
  })

  // Error handling middleware
  expressApp.use((err, req, res, next) => {
    console.error("[Error]", err)
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    })
  })

  // Let Next.js handle everything else
  expressApp.all("*", (req, res) => {
    return handle(req, res)
  })

  const PORT = process.env.PORT || 5000
  console.log(`[Server] Starting server on port ${PORT}`)
  
  expressApp.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Successfully running on port ${PORT}`)
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`)
  })
})
