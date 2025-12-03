// Note: Ensure your config file is named 'path.js' based on your structure
const { LOG_A, LOG_B } = require("../config/path"); 
const { readLastLines } = require("../utils/fileUtils");

async function getLogs() {
    // Read both files in parallel
    const [logsA, logsB] = await Promise.all([
        readLastLines(LOG_A),
        readLastLines(LOG_B)
    ]);

    return {
        serverA: logsA,
        serverB: logsB
    };
}

module.exports = { getLogs };