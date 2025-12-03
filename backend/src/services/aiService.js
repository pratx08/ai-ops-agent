const axios = require('axios');
const { log } = require('../utils/logger');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

async function getAIDecision(healthA, healthB) {
  // 1. Construct the prompt string and save it to a variable
  const prompt = `
You are an AI SRE load balancer.

You MUST follow the rules EXACTLY. No exceptions.

SERVER A:
${JSON.stringify(healthA, null, 2)}

SERVER B:
${JSON.stringify(healthB, null, 2)}

STRICT ROUTING RULES (FOLLOW EXACTLY):

1. AVAILABILITY (HIGHEST PRIORITY)
   - If a server is unreachable, you MUST NOT select it.

2. ERRORS (2nd PRIORITY)
   - If recentErrors > 0 on a server, you MUST AVOID it.
   - A server with errors MUST only be chosen if the other server is unreachable.

3. LATENCY (3rd PRIORITY — HIGH IMPORTANCE)
   - If avgLatencyMs differs by more than 200ms, ALWAYS choose the lower latency server.
   - Latency difference >= 200ms OVERRIDES CPU.

4. CPU (LOWEST PRIORITY)
   - Only compare CPU if latency difference < 200ms AND both servers have zero errors.

You MUST return ONLY raw JSON:

{
  "summary": "Short reasoning",
  "chosenServer": "A" or "B",
  "severity": "info" | "warning" | "critical",
  "recommendedFix": "One sentence"
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