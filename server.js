const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const UNIVERSE_ID = "78374481907574";
const STATS_FILE = "stats.json";

// stats.json automatisch maken
if (!fs.existsSync(STATS_FILE)) {
  fs.writeFileSync(STATS_FILE, JSON.stringify({
    peak: 0,
    history: [],
    events: []
  }, null, 2));
}

// Helper: Roblox events ophalen
async function getRobloxEvents() {
  try {
    const r = await fetch(`https://games.roblox.com/v1/games/${UNIVERSE_ID}/events`);
    const json = await r.json();
    // Voor elk event: naam, start, afbeelding (thumbnail)
    return json.data.map(ev => ({
      name: ev.name,
      startTime: ev.startTime,
      imageUrl: ev.imageUrl
    }));
  } catch (e) {
    return [];
  }
}

// API endpoint voor frontend
app.get("/api/stats", async (req, res) => {
  try {
    // Spelers online
    const r = await fetch(`https://games.roblox.com/v1/games?universeIds=${UNIVERSE_ID}`);
    const json = await r.json();
    const playing = json.data[0].playing;

    const stats = JSON.parse(fs.readFileSync(STATS_FILE));

    // Peak bijwerken
    if (playing > stats.peak) stats.peak = playing;

    // Geschiedenis bijhouden
    stats.history.push({ time: Date.now(), players: playing });
    if (stats.history.length > 288) stats.history.shift();

    // Events ophalen
    stats.events = await getRobloxEvents();

    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));

    res.json({
      online: playing,
      peak: stats.peak,
      history: stats.history,
      events: stats.events
    });
  } catch (e) {
    res.status(500).json({ error: "Roblox offline" });
  }
});

// Frontend HTML
app.get("/", (req,res)=>{
    res.sendFile(__dirname + "/index.html");
});

app.listen(PORT, ()=>{
    console.log(`Server draait op http://localhost:${PORT}`);
});
