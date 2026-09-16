const calculatorForm = document.querySelector("#calculatorForm");
const errorMessage = document.querySelector("#errorMessage");
const summary = document.querySelector("#summary");
const resultsTable = document.querySelector("#resultsTable");
const chartCanvas = document.querySelector("#voltageChart");

let voltageChart;

function capacitorVoltage(timeMs, sourceVoltage, resistance, capacitanceMicrofarads) {
    const timeSeconds = timeMs / 1000;
    const capacitanceFarads = capacitanceMicrofarads / 1000000;

    return sourceVoltage * (1 - Math.exp(-timeSeconds / (resistance * capacitanceFarads)));
}

function createDataPoints(startTime, endTime, sourceVoltage, resistance, capacitance) {
    const points = [];
    const numberOfSteps = 100;
    const stepSize = (endTime - startTime) / numberOfSteps;

    for (let step = 0; step <= numberOfSteps; step++) {
        const time = startTime + step * stepSize;
        points.push({
            x: time,
            y: capacitorVoltage(time, sourceVoltage, resistance, capacitance)
        });
    }

    return points;
}

function displayTable(points) {
    resultsTable.replaceChildren();

    for (let index = 0; index < points.length; index += 10) {
        const row = document.createElement("tr");
        const timeCell = document.createElement("td");
        const voltageCell = document.createElement("td");

        timeCell.textContent = points[index].x.toFixed(2);
        voltageCell.textContent = points[index].y.toFixed(4);

        row.append(timeCell, voltageCell);
        resultsTable.append(row);
    }
}

function displayChart(points) {
    if (voltageChart) {
        voltageChart.destroy();
    }

    voltageChart = new Chart(chartCanvas, {
        type: "line",
        data: {
            datasets: [{
                label: "Capacitor Voltage",
                data: points,
                borderColor: "#813b32",
                backgroundColor: "#813b32",
                borderWidth: 3,
                pointRadius: 0,
                tension: 0.15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: "linear",
                    title: {
                        display: true,
                        text: "Time (milliseconds)"
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Capacitor Voltage (volts)"
                    }
                }
            }
        }
    });
}

function calculate(event) {
    event.preventDefault();
    errorMessage.textContent = "";

    const sourceVoltage = Number(document.querySelector("#sourceVoltage").value);
    const resistance = Number(document.querySelector("#resistance").value);
    const capacitance = Number(document.querySelector("#capacitance").value);
    const startTime = Number(document.querySelector("#startTime").value);
    const endTime = Number(document.querySelector("#endTime").value);

    if (sourceVoltage <= 0 || resistance <= 0 || capacitance <= 0 || startTime < 0 || endTime <= startTime) {
        errorMessage.textContent = "Enter positive circuit values and make the end time greater than the start time.";
        return;
    }

    const points = createDataPoints(startTime, endTime, sourceVoltage, resistance, capacitance);
    const timeConstantMs = resistance * (capacitance / 1000000) * 1000;
    const endingVoltage = points[points.length - 1].y;

    summary.textContent = `The circuit time constant is ${timeConstantMs.toFixed(2)} ms. ` +
        `At ${endTime.toFixed(2)} ms, the capacitor voltage is ${endingVoltage.toFixed(4)} V.`;

    displayTable(points);
    displayChart(points);
}

calculatorForm.addEventListener("submit", calculate);
calculatorForm.requestSubmit();
