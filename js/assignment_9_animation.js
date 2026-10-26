// Based on the WebFX bouncing ball tutorial.
const canvas = document.getElementById("myCanvas");
const context = canvas.getContext("2d");
let x = 100;
let y = 200;
let dx = 2;
let dy = 2;
const radius = 20;
let color = "blue";

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    context.fillStyle = color;
    context.arc(x, y, radius, 0, Math.PI * 2, true);
    context.closePath();
    context.fill();

    // Reverse direction before any part of the ball passes a wall.
    if (x + dx < radius || x + dx > canvas.width - radius) {
        dx = -dx;
    }
    if (y + dy < radius || y + dy > canvas.height - radius) {
        dy = -dy;
    }

    x += dx;
    y += dy;
}

canvas.addEventListener("click", function () {
    if (color === "blue") {
        color = "red";
    } else {
        color = "blue";
    }
});

draw();
setInterval(draw, 10);
