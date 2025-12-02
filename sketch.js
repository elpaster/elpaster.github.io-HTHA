const canvas = document.getElementById("sketchCanvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let strokes = [];     // Each stroke is an array of points
let currentStroke = [];

canvas.addEventListener("mousedown", start);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", end);
canvas.addEventListener("mouseleave", end);

function start(e) {
  drawing = true;
  currentStroke = [];
}

function draw(e) {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  currentStroke.push({ x, y });

  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";

  ctx.beginPath();
  if (currentStroke.length > 1) {
    let prev = currentStroke[currentStroke.length - 2];
    ctx.moveTo(prev.x, prev.y);
  }
  ctx.lineTo(x, y);
  ctx.stroke();
}

function end() {
  if (drawing) strokes.push(currentStroke);
  drawing = false;
}

document.getElementById("clearBtn").onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes = [];
};
