// Read the external file and parse its JSON into JavaScript objects.
fetch("data/fencing.json")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load rankings.");
        }
        return response.json();
    })
    .then(function (fencers) {
        const tableBody = document.getElementById("rankingBody");

        fencers.forEach(function (fencer) {
            const row = document.createElement("tr");
            const values = [fencer.rank, fencer.name, fencer.country, fencer.points.toFixed(3)];

            values.forEach(function (value) {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });

        document.getElementById("rankingStatus").textContent = fencers.length + " fencers loaded.";
    })
    .catch(function () {
        document.getElementById("rankingStatus").textContent = "Unable to load rankings. Please try again later.";
    });
