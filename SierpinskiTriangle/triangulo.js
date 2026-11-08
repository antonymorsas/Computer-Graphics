let canvasElement;
let context;
let level = 0;
let autoTimer = null;

const MAX_LEVEL = 8;
// Arcade palette; each small triangle takes one at random.
const COLORS = ["#ffd23f", "#3ee6ff", "#ff4f9a", "#f4f1ea", "#7cff6b"];

function main(){
    canvasElement = document.querySelector("#trianC");
    context = canvasElement.getContext("2d");
    sliderEvent();
    buttonEvents();
    keyEvents();
    setLevel(0);
}

// Draws the triangle at level n and updates the controls and the numbers.
function setLevel(n){
    level = Math.max(0, Math.min(MAX_LEVEL, n));
    document.getElementById("slider").value = level;
    document.getElementById("sliderValue").textContent = level;
    document.getElementById("triangles").textContent = Math.pow(3, level).toLocaleString("es-MX");
    document.getElementById("area").textContent = formatPercent(Math.pow(3 / 4, level) * 100);
    document.getElementById("minus").disabled = level == 0;
    document.getElementById("plus").disabled = level == MAX_LEVEL;

    context.clearRect(0, 0, canvasElement.width, canvasElement.height);
    sierpinski(context, level, canvasElement.width/2, 0, 0, canvasElement.height, canvasElement.width, canvasElement.height);
}

function formatPercent(p){
    return (p >= 10 ? p.toFixed(0) : p.toFixed(1)) + "%";
}

function sierpinski(con, i,ax,ay,bx,by,cx,cy){
    if(i>0){
        sierpinski(con,i-1,(ax+bx)/2,(ay+cy)/2,bx,by,(bx+cx)/2,by)
        sierpinski(con,i-1,ax,ay,(ax+bx)/2,(ay+cy)/2,(cx+ax)/2,(ay+by)/2)
        sierpinski(con,i-1,(cx+ax)/2,(ay+by)/2,(bx+cx)/2,by,cx,cy)
    }else{
        draw_triangle(con,ax,ay,bx,by,cx,cy);
    }
}

function draw_triangle(con,ax,ay,bx,by,cx,cy){
    // Triangle
    con.beginPath();
    con.moveTo(ax, ay);
    con.lineTo(bx, by);
    con.lineTo(cx, cy);
    con.closePath();
    // Color
    con.fillStyle = getColor();
    con.fill();
    con.strokeStyle = "#000";
    con.lineWidth = 1;
    con.stroke();
}

function getColor(){
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function sliderEvent()
{
    document.getElementById("slider").oninput = function(event) {
        stopAuto();
        setLevel(Number(event.target.value));
    };
}

function buttonEvents(){
    document.getElementById("minus").onclick = function() { stopAuto(); setLevel(level - 1); };
    document.getElementById("plus").onclick = function() { stopAuto(); setLevel(level + 1); };
    document.getElementById("auto").onclick = function() { autoTimer ? stopAuto() : startAuto(); };
}

// ← → change the level (unless the slider has focus: it handles them itself).
function keyEvents(){
    document.addEventListener("keydown", function(event) {
        if (event.target.id == "slider") return;
        if (event.key == "ArrowLeft") { event.preventDefault(); stopAuto(); setLevel(level - 1); }
        if (event.key == "ArrowRight") { event.preventDefault(); stopAuto(); setLevel(level + 1); }
    });
}

// Auto: climbs one level at a time and starts over after the last one.
function startAuto(){
    autoTimer = setInterval(function() { setLevel(level == MAX_LEVEL ? 0 : level + 1); }, 700);
    setAutoButton(true);
}

function stopAuto(){
    if (!autoTimer) return;
    clearInterval(autoTimer);
    autoTimer = null;
    setAutoButton(false);
}

function setAutoButton(on){
    let button = document.getElementById("auto");
    button.textContent = on ? "■ Parar" : "▶ Auto";
    button.setAttribute("aria-pressed", on);
}
