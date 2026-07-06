async function loadHistory() {

    const limitSelect = document.getElementById("limitSelect");
    const searchBox = document.getElementById("searchBox");
    const tbody = document.querySelector("#historyTable tbody");

    if (!limitSelect || !searchBox || !tbody) {
        console.log("History page elements not found.");
        return;
    }

    const limit = limitSelect.value;

   const response = await fetch(`/api/history?limit=${limit}&t=${Date.now()}`, {
    cache: "no-store"
});
    const data = await response.json();

    tbody.innerHTML = "";

    const search = searchBox.value.toLowerCase();

    data.forEach(row => {

        if (!row.controllerId.toLowerCase().includes(search))
            return;

        let mode = "";

        if (row.mode == 0) mode = "Manual";
        else if (row.mode == 1) mode = "Auto";
        else if (row.mode == 2) mode = "Jog";
        else mode = row.mode;

        let safety = "";

        if (row.safety == 8) safety = "OK";
        else if (row.safety == 24) safety = "Safety 1";
        else if (row.safety == 40) safety = "Safety 2";
        else safety = row.safety;

        tbody.innerHTML += `
        <tr>
            <td>${row.timestamp}</td>
            <td>${row.controllerId}</td>
            <td>${mode}</td>
            <td>${safety}</td>
            <td>${row.cycle1}</td>
            <td>${row.doorPosition}%</td>
            <td>${row.fault}</td>
        </tr>`;
    });

}

window.onload = () => {

    loadHistory();

    document.getElementById("searchBox")
        .addEventListener("input", loadHistory);

    document.getElementById("limitSelect")
        .addEventListener("change", loadHistory);

};