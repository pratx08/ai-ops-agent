const express = require("express");
const router = express.Router();
const { getLogs } = require("../services/logService");

router.get("/", async (req, res) => {
    try {
        const logs = await getLogs();
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch logs" });
    }
});

module.exports = router;