async function loadAnalytics() {

    const response = await fetch("/api/history?limit=100");

    const data = await response.json();

    data.reverse();

    const labels = [];
    const position = [];
    const cycles = [];

    data.forEach(row => {

        labels.push(row.timestamp.substring(11,19));

        position.push(row.doorPosition);

        cycles.push(row.Total Cycles);

    });

    const ctx = document.getElementById("positionChart").getContext("2d");

    new Chart(ctx,{

        type:"line",

        data:{

            labels:labels,

            datasets:[{

                label:"Door Position",

                data:position,

                borderWidth:3,

                fill:false

            }]

        },

        options:{

            responsive:true,

            animation:false

        }

    });

}

loadAnalytics();
async function loadStats(){

    const response = await fetch("/api/stats");

    const stats = await response.json();

    document.getElementById("cycleCard").innerText =
        stats.totalCycles;

    document.getElementById("faultCard").innerText =
        stats.totalFaults;

    document.getElementById("emergencyCard").innerText =
        stats.emergencyCount;

    document.getElementById("positionCard").innerText =
        stats.averagePosition + "%";

}

loadStats();