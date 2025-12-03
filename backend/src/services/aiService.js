const axios = require('axios');
const { log } = require('../utils/logger');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

async function getAIDecision(healthA, healthB) {
  // 1. Construct the prompt string and save it to a variable
  const prompt = `
You are an AI SRE Agent.
Server A: ${JSON.stringify(healthA)}
Server B: ${JSON.stringify(healthB)}

Decide which server gets traffic.
Return ONLY raw JSON:
{
  "summary": "Short reason (max 15 words)",
  "chosenServer": "A" or "B",
  "severity": "info" | "warning" | "critical",
  "recommendedFix": "Action to take"
}
`;

  try {
    const res = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: { temperature: 0.1 } 
      },
      { timeout: 40000 }
    );

    const rawText = res.data.response || '';
    const parsed = parseAIResponse(rawText);

    // 2. Return the parsed decision PLUS the raw data for the UI
    return {
      ...parsed,
      promptUsed: prompt,
      rawResponse: rawText
    };

  } catch (err) {
    log(`AI Service Failed: ${err.message}`);
    // Return fallback data but include the prompt so we can debug in UI
    return {
      summary: "AI Offline - Failover to A",
      chosenServer: "A",
      severity: "critical",
      recommendedFix: "Check LLM",
      reason: "Fallback",
      promptUsed: prompt,
      rawResponse: "Error: " + err.message
    };
  }
}

function parseAIResponse(text) {
  try {
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      clean = clean.substring(start, end + 1);
    }

    return JSON.parse(clean);
  } catch (e) {
    log("JSON Parse Error. Raw:", text);
    return {
      summary: "Parse Error - Defaulting A",
      chosenServer: "A",
      severity: "warning",
      recommendedFix: "Check Prompt"
    };
  }
}

module.exports = { getAIDecision };