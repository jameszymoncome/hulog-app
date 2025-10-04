// filepath: server/routes/fundRoutes.js
const express = require("express");
const Fund = require("../models/Fund");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const router = express.Router();

// Middleware: authenticate user
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id; // store just the user id
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ Add a fund
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ message: "Amount is required" });

    const fund = new Fund({
      amount,
      user: req.user, // just the id
    });

    await fund.save();
    res.json(fund);
  } catch (err) {
    console.error("Add fund error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get total funds (all users)
router.get("/total", authMiddleware, async (req, res) => {
  try {
    const funds = await Fund.find();
    const total = funds.reduce((sum, f) => sum + f.amount, 0);
    res.json({ total });
  } catch (err) {
    console.error("Total funds error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all funds (with user info)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const funds = await Fund.find()
      .populate("user", "name email") // attach user info
      .sort({ createdAt: -1 });

    res.json(funds);
  } catch (err) {
    console.error("Get funds error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Weekly summary
router.get("/weekly", authMiddleware, async (req, res) => {
  try {
    const funds = await Fund.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            week: { $isoWeek: "$createdAt" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    res.json(funds);
  } catch (err) {
    console.error("Weekly aggregation error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
