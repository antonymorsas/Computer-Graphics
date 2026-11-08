// Drag to rotate: the last pointer X while dragging, in pixels.
let dragging = false,
    lastX = 0;

function rotateScene(deltax, group) {
    group.rotation.y += deltax / 100;
}

function scaleScene(scale, group) {
    group.scale.set(scale, scale, scale);
    document.getElementById("scale").textContent = scale.toFixed(2) + "x";
}

// Pointer events: mouse, pen and touch. Only the X movement matters, so the
// canvas' position on the page doesn't.
function onPointerDown(evt, canvas) {
    dragging = true;
    lastX = evt.clientX;
    canvas.setPointerCapture(evt.pointerId);
    canvas.classList.add("dragging");
}

function onPointerMove(evt, group) {
    if (!dragging) return;
    evt.preventDefault();
    rotateScene(evt.clientX - lastX, group);
    lastX = evt.clientX;
}

function onPointerUp(evt, canvas) {
    dragging = false;
    canvas.classList.remove("dragging");
}

function addMouseHandler(canvas, group) {
    canvas.addEventListener("pointerdown", e => onPointerDown(e, canvas));
    canvas.addEventListener("pointermove", e => onPointerMove(e, group));
    canvas.addEventListener("pointerup", e => onPointerUp(e, canvas));
    canvas.addEventListener("pointercancel", e => onPointerUp(e, canvas));

    document.getElementById("slider").addEventListener("input", e => scaleScene(Number(e.target.value), group));
}

function btnEvnts() {
    document.getElementById("add").addEventListener("click", function () {
        addFigure();
    });

    document.getElementById("addOrbit").addEventListener("click", function () {
        addOrbit();
    });

    document.getElementById("satelite").addEventListener("click", function () {
        addSatelite();
    });

    document.getElementById("clear").addEventListener("click", function () {
        clearFigures();
    });
}

// Live numbers in the panel; called every frame from run().
function updateStatus() {
    if (!groups.length) return;
    let degrees = ((groups[0].rotation.y * 180 / Math.PI) % 360 + 360) % 360;
    let moons = objects.reduce((n, o) => n + o.satelites.length, 0);
    document.getElementById("rotation").textContent = Math.round(degrees) + "°";
    document.getElementById("objects").textContent = objects.length;
    document.getElementById("rings").textContent = rings.length;
    document.getElementById("moons").textContent = moons;
    // A ring or a moon needs at least one object to hang from.
    document.getElementById("addOrbit").disabled = objects.length == 0;
    document.getElementById("satelite").disabled = objects.length == 0;
}
