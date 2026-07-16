const protocol = window.location.protocol === "https:" ? "wss" : "ws";
let lastAlarmMessage = "🟢 NO ACTIVE ALARM";
let lastAlarmTime = 0;
const ws = new WebSocket(`${protocol}://${window.location.host}`);
let selectedController = "HSD_GUJ_001";
let doorLocked = false;

function updateLockButton() {

    const lockBtn = document.getElementById("stopBtn");
    const unlockBtn = document.getElementById("releaseBtn");

    if (doorLocked) {

        lockBtn.style.background = "#ef4444";
        lockBtn.style.color = "#fff";

        unlockBtn.style.background = "";
        unlockBtn.style.color = "";

    } else {

        unlockBtn.style.background = "#22c55e";
        unlockBtn.style.color = "#fff";

        lockBtn.style.background = "";
        lockBtn.style.color = "";
    }
}
// ===== Chart =====

const chartLabels = [];
const chartData = [];

const ctx = document.getElementById("doorChart").getContext("2d");

const doorChart = new Chart(ctx, {

    type: "line",

    data: {

        labels: chartLabels,

        datasets: [{

            label: "Door Position (%)",

            data: chartData,

            borderColor: "#22d3ee",

            backgroundColor: "rgba(34,211,238,0.15)",

            borderWidth: 3,

            fill: true,

            tension: 0

        }]

    },

   options: {

    responsive: true,

    animation: false,

    plugins: {

        legend: {

            display: false

        },

        title: {

            display: true,

            text: "Door Position Trend",

            color: "#ffffff",

            font: {

                size: 18

            }

        }

    },

    scales: {

        x: {

            ticks: {

                maxTicksLimit: 8

            },

            grid: {

                color: "rgba(255,255,255,0.08)"

            }

        },

        y: {

            min: 0,

            max: 100,

            ticks: {

                stepSize: 20

            },

            grid: {

                color: "rgba(255,255,255,0.08)"

            }

        }

    }

}

});

ws.onopen = () => {
    console.log("Connected");
};

ws.onmessage = (event) => {

    const d = JSON.parse(event.data);
    if (d.controllerId !== selectedController)
    return;

    // Mode
const modeText = {
    0: "Manual",
    1: "Auto",
    2: "Jog"
};

// Safety
const safetyText = {
    8: "OK",
    24: "Safety 1 Activated",
    40: "Safety 2 Activated"
};

// Emergency
const emergencyText = {
    0: "Disabled",
    8: "Enabled"
};

// Door State
const doorStateText = {
    0: "Closed",
    1: "Opening",
    2: "Opened",
    3: "Closing",
    4: "Stopping",
    5: "Stopped Midway"
};

// Fault Codes
const faultText = {
    0: "No Fault",
    6: "Motor / Brake Failure",
    13: "Internal Encoder Failure",
    29: "External Encoder Failure"
};

    // System data
    document.getElementById("controllerId").innerText =
    d.controllerId;
    document.getElementById("controllerIdTop").innerText =
    d.controllerId;

document.getElementById("lastUpdateTop").innerText =
    new Date().toLocaleTimeString();

const connectionStatus = document.getElementById("connectionStatus");

if (connectionStatus) {
    connectionStatus.innerHTML = "🟢 Connected";
    connectionStatus.style.color = "#22c55e";
}
    document.getElementById("lastUpdate").innerText =
    new Date().toLocaleTimeString();
    
    document.getElementById("mode").innerText =
    modeText[d.mode] || d.mode;

document.getElementById("safety").innerText =
    safetyText[d.safety] || d.safety;

document.getElementById("emergency").innerText =
    emergencyText[d.emergency] || d.emergency;

document.getElementById("fault").innerText =
    faultText[Number(d.fault)] || ("Fault Code " + d.fault);

    document.getElementById("openSpeed").innerText = d.openingSpeed;
    document.getElementById("closeSpeed").innerText = d.closingSpeed;
    document.getElementById("cycle1").innerText = d.cycle1;
    document.getElementById("cycle2").innerText = d.cycle2;
    document.getElementById("motorLoad").innerText =
    d.motorLoad ?? "--";

document.getElementById("openingLimit").innerText =
    d.openingLimit ?? "--";

document.getElementById("closingLimit").innerText =
    d.closingLimit ?? "--";

    document.getElementById("autoCloseTime").innerText =
    (d.autoCloseTime ?? "--") + " s";

    document.getElementById("doorPosition").innerText = d.doorPosition;
    // KPI Cards

document.getElementById("kpiDoor").innerText = d.doorPosition;

document.getElementById("totalCycle").innerText = d.cycle1;

// ===============================
// Smart Health Score
// ===============================

const MAX_CYCLES = 750;

let health = Math.round(
    ((MAX_CYCLES - Number(d.cycle1 || 0)) / MAX_CYCLES) * 100
);

if (health < 0) health = 0;
if (health > 100) health = 100;

// Fault penalty
if (d.fault != 0)
    health -= 20;

// Emergency penalty
if (d.emergency != 0)
    health -= 10;

// Safety penalty
if (d.safety != 8)
    health -= 5;

if (health < 0)
    health = 0;

document.getElementById("health").innerText = health + "%";
const healthStatus = document.getElementById("healthStatus");

if (health >= 90) {
    healthStatus.innerText = "🟢 Excellent";
    healthStatus.style.color = "#22c55e";
}
else if (health >= 75) {
    healthStatus.innerText = "🟡 Good";
    healthStatus.style.color = "#facc15";
}
else if (health >= 50) {
    healthStatus.innerText = "🟠 Warning";
    healthStatus.style.color = "#fb923c";
}
else {
    healthStatus.innerText = "🔴 Critical";
    healthStatus.style.color = "#ef4444";
}

// Fault Status

document.getElementById("faultStatus").innerText =
(d.fault == 0) ? "Normal" : "Fault";
let state = "";

switch(Number(d.doorState)){

    case 0:
        state="Closed";
        break;

    case 1:
        state="Opening";
        break;

    case 2:
        state="Opened";
        break;

    case 3:
        state="Closing";
        break;

    case 4:
        state="Stopping";
        break;

    case 5:
        state="Stopped Midway";
        break;

    default:
        state="Unknown";

}

document.getElementById("doorState").innerText = state;

   // 🚪 Improved Door Animation
const door = document.getElementById("doorVisual");
let pos = Number(d.doorPosition);

// Alert Message

let alert = "✅ System Healthy";

if (d.fault != 0)
    alert = "🔴 Fault Detected";

else if (d.emergency == 8)
    alert = "🟠 Emergency Active";

else if (health < 70)
    alert = "🟡 Maintenance Recommended";

document.getElementById("alertText").innerText = alert;

// Door height (0% = fully closed, 100% = fully open)
const frameHeight = 282;

// Door moves upward smoothly
door.style.transform = `translateY(${-pos * frameHeight / 100}px)`;

// Door colour according to state
switch(Number(d.doorState)){

    case 0: // Closed
        door.style.background = "linear-gradient(180deg,#ef4444,#b91c1c)";
        break;

    case 1: // Opening
        door.style.background = "linear-gradient(180deg,#f59e0b,#d97706)";
        break;

    case 2: // Open
        door.style.background = "linear-gradient(180deg,#22c55e,#15803d)";
        break;

    case 3: // Closing
        door.style.background = "linear-gradient(180deg,#3b82f6,#2563eb)";
        break;

    default:
        door.style.background = "linear-gradient(180deg,#64748b,#475569)";
}
// ===== Live Chart Update =====

chartLabels.push(new Date().toLocaleTimeString());

chartData.push(Number(d.doorPosition));

if (chartLabels.length > 20) {

    chartLabels.shift();
    chartData.shift();

}

doorChart.update();
console.log("Emergency:", d.emergency, "Fault:", d.fault);
updateAlarm(d);

};
ws.onerror = () => {
    console.log("WebSocket Error");
};
// ===============================
// Remote Control
// ===============================

async function sendCommand(command){

    const response = await fetch("/api/control",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({
            command:command
        })

    });

    const result = await response.json();

    console.log(result);

}

document.getElementById("openBtn").addEventListener("click",()=>{

    sendCommand("OPEN");

});

document.getElementById("closeBtn").addEventListener("click",()=>{

    sendCommand("CLOSE");

});

document.getElementById("stopBtn").addEventListener("click", () => {

    sendCommand("STOP");

    doorLocked = true;

    updateLockButton();

});

document.getElementById("releaseBtn").addEventListener("click", () => {

    sendCommand("RELEASE");

    doorLocked = false;

    updateLockButton();

});


// ===============================
// AI Prediction
// ===============================

async function loadPrediction(){

    try{

        const response = await fetch("/api/predict");

        const ai = await response.json();

        document.getElementById("aiRisk").innerText =
            ai.risk;

        document.getElementById("remainingCycles").innerText =
            ai.remainingCycles;

        document.getElementById("recommendation").innerText =
            ai.recommendation;

    }

    catch(e){

        console.log(e);

    }

}

setInterval(loadPrediction,1000);

loadPrediction();
function updateAlarm(d){

    const panel = document.getElementById("alarmPanel");
    const icon = document.querySelector(".alarmIcon");
    const title = document.getElementById("alarmTitle");
    const desc = document.getElementById("alarmDesc");

    if(d.fault != 0){

        panel.style.borderLeftColor = "#ef4444";
        icon.innerText = "🔴";
        title.innerText = "Motor Fault";
        desc.innerText = "Immediate inspection required.";

    }

    else if(d.emergency != 0){

        panel.style.borderLeftColor = "#f59e0b";
        icon.innerText = "🟠";
        title.innerText = "Emergency Stop";
        desc.innerText = "Emergency circuit is active.";

    }

    else if(Number(d.cycle1) > 5000){

        panel.style.borderLeftColor = "#facc15";
        icon.innerText = "🟡";
        title.innerText = "Maintenance Due";
        desc.innerText = "Cycle count exceeded maintenance threshold.";

    }

    else{

        panel.style.borderLeftColor = "#22c55e";
        icon.innerText = "🟢";
        title.innerText = "No Active Alarm";
        desc.innerText = "All monitored parameters are operating normally.";

    }

}
async function loadEvents(){

    const response = await fetch("/api/events");

    const data = await response.json();

    const div = document.getElementById("eventList");

    div.innerHTML = "";

    data.forEach(e=>{

        let text = "Door Status";

        if(e.fault != 0)
            text = "🔴 Fault Detected";

        else if(e.emergency != 0)
            text = "🟠 Emergency Activated";

        else if(e.safety != 8)
            text = "🟡 Safety Trigger";

        else if(e.doorState == 0)
            text = "🚪 Door Closed";

        else if(e.doorState == 5)
            text = "🚪 Door Opened";

        div.innerHTML += `
        <p style="padding:8px 0;border-bottom:1px solid #334155">
            ${e.timestamp} — ${text}
        </p>`;
    });

}

setInterval(loadEvents,2000);

loadEvents();
async function checkConnection() {

    try {

        const response = await fetch("/api/status");
        const data = await response.json();

        const connectionStatus = document.getElementById("connectionStatus");

        if (data.status === "ONLINE") {

            connectionStatus.innerHTML = "🟢 Connected";
            connectionStatus.style.color = "#22c55e";

        }

        else if (data.status === "SLOW") {

            connectionStatus.innerHTML = "🟡 Slow Communication";
            connectionStatus.style.color = "#f59e0b";

        }

        else {

            connectionStatus.innerHTML = "🔴 Controller Offline";
            connectionStatus.style.color = "#ef4444";

        }

    }

    catch (e) {

        const connectionStatus = document.getElementById("connectionStatus");

        connectionStatus.innerHTML = "🔴 Server Offline";
        connectionStatus.style.color = "#ef4444";

    }

}

setInterval(checkConnection, 4000);
checkConnection();

async function loadControllers(){

    const response = await fetch("/api/controllers");

    const controllers = await response.json();

    const select = document.getElementById("controllerSelect");

    select.innerHTML = "";

    controllers.forEach(c=>{

        select.innerHTML += `
        <option value="${c.controllerId}">
            ${c.controllerId}
        </option>`;

    });

}

document.getElementById("controllerSelect")
.addEventListener("change",(e)=>{

    selectedController = e.target.value;
   doorLocked=false;
updateLockButton();

});

setInterval(loadControllers,8000);

loadControllers();
updateLockButton();
const menuBtn=document.getElementById("menuBtn");

if(menuBtn){

menuBtn.onclick=()=>{

document.querySelector(".sidebar")
.classList.toggle("active");

}

}
