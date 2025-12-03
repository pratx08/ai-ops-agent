const express = require("express");
const router = express.Router();

const { getLogs } = require("../services/logService");
const { analyzeWithLLM } = require("../services/aiService");

router.get("/", async (req, res) => {
    const logs = getLogs();

    const prompt = `
You are an AI analyzing server logs.
Compare Server A and Server B.

Server A Logs:
${logs.serverA}

Server B Logs:
${logs.serverB}

Return in this format:
- Summary of issues
- Healthiest server
- Severity (1-10)
- Recommended fix
- Should we switch server?
    `;

    const analysis = await analyzeWithLLM(prompt);

    res.status(200).json({
        success: true,
        analysis
    });
});

module.exports = router;
