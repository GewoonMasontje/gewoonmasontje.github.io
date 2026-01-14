// Brainrot World Mini Server - Alles in 1 bestand
const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const UNIVERSE_ID = "78374481907574";
const STATS_FILE = "stats.json";

// Zorg dat stats.json bestaat
if (!fs.existsSync(STATS_FILE)) {
    fs.writeFileSync(STATS_FILE, JSON.stringify({
        peak: 0,
        history: []
    }, null, 2));
}

// Endpoint voor frontend
app.get("/api/stats", async (req, res) => {
    try {
        const r = await fetch(`https://games.roblox.com/v1/games?universeIds=${UNIVERSE_ID}`);
        const json = await r.json();
        const playing = json.data[0].playing;

        // Stats bijwerken
        const stats = JSON.parse(fs.readFileSync(STATS_FILE));
        if (playing > stats.peak) stats.peak = playing;
        stats.history.push({ time: Date.now(), players: playing });
        if (stats.history.length > 288) stats.history.shift(); // max ~24 uur data
        fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));

        res.json({ online: playing, peak: stats.peak, history: stats.history });
    } catch (e) {
        res.status(500).json({ error: "Roblox offline" });
    }
});

// Frontend: direct HTML serveren
app.get("/", (req,res)=>{
    res.sendFile(__dirname + "/index.html");
});

app.listen(PORT, ()=>{
    console.log(`Brainrot World server draait op http://localhost:${PORT}`);
});
