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