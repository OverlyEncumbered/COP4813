const canvas = document.getElementById("spirograph");
const ctx = canvas.getContext("2d");
const drawButton = document.getElementById("drawButton");
const drawingStatus = document.getElementById("drawingStatus");

function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function greatestCommonDivisor(a, b) {
    while (b !== 0) {
        [a, b] = [b, a % b];
    }
    return a;
}

drawButton.addEventListener("click", () => {
    const R = randomInteger(80, 140);
    const r = randomInteger(25, 65); // r is always less than R.
    const O = randomInteger(10, 65);
    const scale = (canvas.width / 2 - 20) / (R + 2 * r + O);
    const end = 2 * Math.PI * r / greatestCommonDivisor(R, r);
    const step = 0.015;
    let t = 0;

    function position(angle) {
        const x = (R + r) * Math.cos(angle) - (r + O) * Math.cos(((R + r) / r) * angle);
        const y = (R + r) * Math.sin(angle) - (r + O) * Math.sin(((R + r) / r) * angle);
        return [canvas.width / 2 + x * scale, canvas.height / 2 + y * scale];
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(...position(0));
    ctx.strokeStyle = "#813b32";
    ctx.lineWidth = 2;
    drawButton.disabled = true;
    drawingStatus.textContent = "Drawing…";

    function drawFrame() {
        // Draw several small segments per frame so the line visibly grows.
        ctx.beginPath();
        ctx.moveTo(...position(t));
        for (let i = 0; i < 100 && t < end; i++) {
            t = Math.min(t + step, end);
            ctx.lineTo(...position(t));
        }
        ctx.stroke();

        if (t < end) {
            requestAnimationFrame(drawFrame);
        } else {
            drawButton.disabled = false;
            drawingStatus.textContent = "Finished. Press Draw Spirograph for a new pattern.";
        }
    }

    requestAnimationFrame(drawFrame);
});
