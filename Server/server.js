const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static("public"));
let db;

async function initDatabase() {

    db = await open({
        filename: "../Database/doors.db",
        driver: sqlite3.Database
    });

    await db.exec(`

        CREATE TABLE IF NOT EXISTS door_logs(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            controllerId TEXT,

            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

            mode INTEGER,
            safety INTEGER,
            autoCloseTime INTEGER,

            openingSpeed INTEGER,
            closingSpeed INTEGER,

            cycle1 INTEGER,
            cycle2 INTEGER,

            emergency INTEGER,
            fault INTEGER,

            doorState INTEGER,
            doorPosition INTEGER

        )

    `);

    console.log("✅ Database Ready");

}

let latestData = {
    controllerId: "HSD_GUJ_001",
    mode: 0,
    safety: 8,
    autoCloseTime: 8,
    openingSpeed: 70,
    closingSpeed: 60,
    cycle1: 535,
    cycle2: 110,
    emergency: 8,
    fault: 0,
    doorState: 0,
    doorPosition: 0
};
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
// ESP32 data receive karega
app.post("/api/data", async (req, res) => {
console.log("API HIT");
    latestData = req.body;

    console.log("Data Received:");
    console.log(latestData);

    await db.run(

`INSERT INTO door_logs(

controllerId,
mode,
safety,
autoCloseTime,
openingSpeed,
closingSpeed,
cycle1,
cycle2,
emergency,
fault,
doorState,
doorPosition

)

VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,

latestData.controllerId,
latestData.mode,
latestData.safety,
latestData.autoCloseTime,
latestData.openingSpeed,
latestData.closingSpeed,
latestData.cycle1,
latestData.cycle2,
latestData.emergency,
latestData.fault,
latestData.doorState,
latestData.doorPosition

);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(latestData));
        }
    });

    res.send("OK");
});

// ===============================
// History API
// ===============================

app.get("/api/history", async (req, res) => {

    const limit = Number(req.query.limit) || 50;

    const rows = await db.all(

        `SELECT
        timestamp,
        controllerId,
        mode,
        safety,
        emergency,
        fault,
        cycle1,
        cycle2,
        doorState,
        doorPosition
        FROM door_logs
        ORDER BY id DESC
        LIMIT ?`,

        [limit]

    );

    res.json(rows);

});

// ===============================
// Recent Events API
// ===============================

app.get("/api/events", async (req, res) => {

    const rows = await db.all(`
        SELECT
        timestamp,
        doorState,
        fault,
        emergency,
        safety
        FROM door_logs
        ORDER BY id DESC
        LIMIT 20
    `);

    res.json(rows);

});

// ===============================
// Dashboard Statistics API
// ===============================

app.get("/api/stats", async (req, res) => {

    const totalCycles = await db.get(`
        SELECT MAX(cycle1) AS total
        FROM door_logs
    `);

    const totalFaults = await db.get(`
        SELECT COUNT(*) AS faults
        FROM door_logs
        WHERE fault != 0
    `);

    const emergencyCount = await db.get(`
        SELECT COUNT(*) AS emergency
        FROM door_logs
        WHERE emergency != 0
    `);

    const avgPosition = await db.get(`
        SELECT AVG(doorPosition) AS avgPos
        FROM door_logs
    `);

    res.json({
        totalCycles: totalCycles.total || 0,
        totalFaults: totalFaults.faults || 0,
        emergencyCount: emergencyCount.emergency || 0,
        averagePosition: Math.round(avgPosition.avgPos || 0)
    });

});

// ===============================
// AI Prediction API
// ===============================

app.get("/api/predict", async (req, res) => {

    const last = await db.get(`
        SELECT *
        FROM door_logs
        ORDER BY id DESC
        LIMIT 1
    `);

    let health = 100;

    if(last.fault != 0)
        health -= 35;

    if(last.emergency != 0)
        health -= 20;

    if(last.safety != 8)
        health -= 10;

    if(last.cycle1 > 5000)
        health -= 10;

    let risk = "Low";

    if(health < 80)
        risk = "Medium";

    if(health < 60)
        risk = "High";

    res.json({

        health,

        risk,

        remainingCycles: Math.max(0,15000-last.cycle1),

        recommendation:

        health > 80 ?

        "System Healthy"

        :

        "Inspect Motor, Belt & Roller"

    });

});

// ===============================
// CSV Export
// ===============================

app.get("/api/export", async (req, res) => {

    const rows = await db.all(`
        SELECT *
        FROM door_logs
        ORDER BY id DESC
    `);

    let csv =
`Timestamp,Controller,Mode,Safety,Emergency,Fault,Cycle1,Cycle2,DoorState,DoorPosition\n`;

    rows.forEach(r => {

        csv +=
`${r.timestamp},${r.controllerId},${r.mode},${r.safety},${r.emergency},${r.fault},${r.cycle1},${r.cycle2},${r.doorState},${r.doorPosition}\n`;

    });

    res.header("Content-Type","text/csv");

    res.attachment("DoorHistory.csv");

    res.send(csv);

});

// ===============================
// Remote Control API
// ===============================

let latestCommand = "NONE";

app.post("/api/control", (req, res) => {

    latestCommand = req.body.command;

    console.log("📤 Command Received:", latestCommand);

    res.json({
        success: true
    });

});

app.get("/api/control", (req, res) => {

    res.json({
        command: latestCommand
    });

    // Command sirf ek baar bhejna
    latestCommand = "NONE";

});

// Browser connect
wss.on("connection", ws => {

    console.log("Dashboard Connected");

    ws.send(JSON.stringify(latestData));
});

initDatabase();

server.listen(3000, () => {

    console.log("=================================");
    console.log("Digital Twin Server Started");
    console.log("http://localhost:3000");
    console.log("=================================");

});