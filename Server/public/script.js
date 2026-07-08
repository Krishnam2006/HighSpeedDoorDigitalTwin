const protocol = window.location.protocol === "https:" ? "wss" : "ws";
let lastAlarmMessage = "🟢 NO ACTIVE ALARM";
let lastAlarmTime = 0;
const ws = new WebSocket(`${protocol}://${window.location.host}`);
let selectedController = "HSD_GUJ_001";
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
    3: "Closing"
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

    document.getElementById("doorPosition").innerText = d.doorPosition;
    // KPI Cards

document.getElementById("kpiDoor").innerText = d.doorPosition;

document.getElementById("totalCycle").innerText = d.cycle1;

// ===============================
// Smart Health Score
// ===============================

let health = 100;

// Fault
if (d.fault != 0)
    health -= 35;

// Emergency
if (d.emergency == 8)
    health -= 20;

// Safety Trigger
if (d.safety != 8)
    health -= 10;

// High Cycle Count
if (d.cycle1 > 1000)
    health -= 5;

if (d.cycle1 > 5000)
    health -= 10;

if (health < 0)
    health = 0;

document.getElementById("health").innerText = health + "%";

// Fault Status

document.getElementById("faultStatus").innerText =
(d.fault == 0) ? "Normal" : "Fault";
let state = "";

switch (Number(d.doorState)) {
    case 0:
        state = "Closed";
        break;
    case 1:
        state = "Opening";
        break;
    case 2:
        state = "Opened";
        break;
    case 3:
        state = "Closing";
        break;
    default:
        state = "Unknown";
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

    const now = Date.now();

    let alarm = "";

    if(Number(d.fault) == 6)
        alarm = "🔴 MOTOR / BRAKE FAILURE";

    else if(Number(d.fault) == 13)
        alarm = "🔴 INTERNAL ENCODER FAILURE";

    else if(Number(d.fault) == 29)
        alarm = "🔴 EXTERNAL ENCODER FAILURE";

    else if(Number(d.emergency) != 0)
        alarm = "🟠 EMERGENCY STOP ACTIVE";

    else if(Number(d.safety) != 8)
        alarm = "🟡 SAFETY CIRCUIT ACTIVE";

    else if(Number(d.cycle1) > 5000)
        alarm = "🟡 MAINTENANCE DUE";

    if(alarm !== ""){

        lastAlarmMessage = alarm;
        lastAlarmTime = now;

    }

    if(now - lastAlarmTime < 10000){

        panel.innerHTML = lastAlarmMessage;
        panel.style.color = "#ef4444";

    }else{

        panel.innerHTML = "🟢 NO ACTIVE ALARM";
        panel.style.color = "#22c55e";

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

setInterval(loadEvents,1000);

loadEvents();
async function checkConnection() {

    try {

        const response = await fetch("/api/status");
        const data = await response.json();

        const status = document.getElementById("connectionStatus");

        if (data.status === "ONLINE") {

            status.innerHTML = "🟢 Connected";
            status.style.background = "";
status.style.color = "#22c55e";

        }

        else if (data.status === "SLOW") {

            status.innerHTML = "🟡 Slow Communication";
            status.style.background = "";
status.style.color = "#f59e0b";

        }

        else {

            status.innerHTML = "🔴 Controller Offline";
            status.style.background = "";
status.style.color = "#ef4444";

        }

    }

    catch {

        const status = document.getElementById("connectionStatus");
        status.innerHTML = "🔴 Server Offline";
        status.style.background = "#ef4444";

    }

}

setInterval(checkConnection, 1000);
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

});

setInterval(loadControllers,5000);

loadControllers();