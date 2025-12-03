const fs = require("fs").promises;
const fsSync = require("fs"); 

async function readLastLines(filePath, n = 50) {
    try {
        // Simple check if file exists (sync is fine here for speed)
        if (!fsSync.existsSync(filePath)) {
            return "Log file not found";
        }

        const data = await fs.readFile(filePath, "utf8");
        const lines = data.trim().split("\n");
        return lines.slice(-n).join("\n");
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
        return "Error reading logs";
    }
}

module.exports = { readLastLines };