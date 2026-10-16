const express = require("express");
const Expense = require("../model/expense");
const Revenue = require("../model/revenue");

const router = express.Router();

// Read the existing, case-sensitive collections. Captured payments are recorded
// by the payment service; these GET routes never seed or create finance records.
for (const [path, Model] of [
  ["/expenses", Expense],
  ["/revenues", Revenue],
]) {
  router.get(path, async (_req, res) => {
    try {
      const records = await Model.find()
        .sort({ date: -1, createdAt: -1, _id: -1 })
        .maxTimeMS(10000)
        .lean();
      res.set("Cache-Control", "no-store").json(records);
    } catch (error) {
      console.error(`Unable to load ${Model.modelName}:`, error.message);
      res.status(503).json({
        success: false,
        message: "Financial records are unavailable. Please try again.",
      });
    }
  });
}

module.exports = router;
