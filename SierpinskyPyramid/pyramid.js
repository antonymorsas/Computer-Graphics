let projectionMatrix = null,
    shaderProgram = null;

let shaderVertexPositionAttribute = null,
    shaderVertexColorAttribute = null,
    shaderProjectionMatrixUniform = null,
    shaderModelViewMatrixUniform = null;

let mat4 = glMatrix.mat4;

let duration = 10000;

// Page state: recursion level of each face, pause, and the faces being drawn.
const MIN_LEVEL = 0;
const MAX_LEVEL = 6;
let level = 3;
let paused = false;
let glCtx = null;
let faces = [];

// Arcade palette (RGBA 0..1); each small triangle takes one at random.
const COLORS = [
    [1.0, 0.82, 0.25, 1], // yellow
    [0.24, 0.9, 1.0, 1],  // cyan
    [1.0, 0.31, 0.6, 1],  // pink
    [0.96, 0.95, 0.92, 1], // bone
    [0.49, 1.0, 0.42, 1], // green
];

let vertexShaderSource = `
attribute vec3 vertexPos;
attribute vec4 vertexColor;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec4 vColor;

void main(void) {
    // Return the transformed and projected vertex value
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPos, 1.0);
    // Output the vertexColor in vColor
    vColor = vertexColor;
}`;

let fragmentShaderSource = `
    precision lowp float;
    varying vec4 vColor;

    void main(void) {
    // Return the pixel color: always output white
    gl_FragColor = vColor;
}
`;

function createShader(gl, str, type) {
    let shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShader(gl) {
    // load and compile the fragment and vertex shader
    let fragmentShader = createShader(gl, fragmentShaderSource, "fragment");
    let vertexShader = createShader(gl, vertexShaderSource, "vertex");

    // link them together into a new program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // get pointers to the shader params
    shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPos");
    gl.enableVertexAttribArray(shaderVertexPositionAttribute);

    shaderVertexColorAttribute = gl.getAttribLocation(shaderProgram, "vertexColor");
    gl.enableVertexAttribArray(shaderVertexColorAttribute);

    shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
}

function initWebGL(canvas) {
    let gl = null;
    let msg = "Your browser does not support WebGL, or it is not enabled by default.";

    try {
        gl = canvas.getContext("experimental-webgl");
    } catch (e) {
        msg = "Error creating WebGL Context!: " + e.toString();
    }

    if (!gl) {
        alert(msg);
        throw new Error(msg);
    }

    return gl;
}

function initViewport(gl, canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initGL(gl, canvas) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 1, 100);
}

function draw(gl, objs) {
    // clear the background (with black)
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // set the shader to use
    gl.useProgram(shaderProgram);

    for (obj of objs) {
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
        gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.vertexAttribPointer(shaderVertexColorAttribute, obj.colorSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indices);

        gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
        gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, obj.modelViewMatrix);

        gl.drawElements(obj.primtype, obj.nIndices, gl.UNSIGNED_SHORT, 0);
    }
}

let tempVerts=[]
function sierpinski(i,ax,ay,az,bx,by,bz,cx,cy,cz){
    if(i>0){
       sierpinski(i-1,ax,ay,az,(ax+bx)/2,(ay+cy)/2,(bz+az)/2,(ax+cx)/2,(ay+by)/2,(cz+az)/2); //A
       sierpinski(i-1,(ax+bx)/2,(ay+cy)/2,(bz+az)/2,bx,by,bz,(bx+cx)/2,by,cz); //B
       sierpinski(i-1,(cx+ax)/2,(ay+by)/2,(cz+az)/2,(bx+cx)/2,by,bz,cx,cy,cz); //C
    }else{
        //console.log(ax,ay,bx,by,cx,cy);
        tempVerts.push(ax,ay,az,bx,by,bz,cx,cy,cz);
    }
}

function getRandomRGBA(){
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function createPyramid(gl, translation, rotationAxis, type, faceLevel) {
    let verts = [];
    tempVerts = []; // each face gets only its own triangles
    sierpinski(faceLevel,0,1,0,-1.735,-1,1,1.735,-1,1);
    //sierpinski(3,0,-1,-1,-1.735,-1,1,1.735,-1,1);

    verts.push(...tempVerts);

    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    let vertexColors = [];

    for(let i=0;i<verts.length/3;i++){
        let aColor = getRandomRGBA();
        vertexColors.push(...aColor);
        vertexColors.push(...aColor);
        vertexColors.push(...aColor);
    }

    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    let pyramidIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramidIndexBuffer);

    let pyramidIndices = []

    for(let i=0;i<verts.length/3;i++){
        pyramidIndices.push(i);
    }

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(pyramidIndices), gl.STATIC_DRAW);

    let pyramid = {
        buffer: vertexBuffer,
        colorBuffer: colorBuffer,
        indices: pyramidIndexBuffer,
        vertSize: 3,
        nVerts: verts.length / 3,
        colorSize: 4,
        nColors: vertexColors.length / 4,
        nIndices: pyramidIndices.length,
        primtype: gl.TRIANGLES,
        modelViewMatrix: mat4.create(),
        currentTime: Date.now()
    };

    mat4.translate(pyramid.modelViewMatrix, pyramid.modelViewMatrix, translation);
    let rot, rx, ry;
    //Front
    if(type==1) {rot=Math.PI; rx=0; ry=0.1}
    else if(type==2) {rot=Math.PI/3; rx=0; ry=0.1}
    else if(type==3) {rot=(5*Math.PI)/3; rx=0; ry=0.1}
    mat4.rotate(pyramid.modelViewMatrix, pyramid.modelViewMatrix, rot, [rx, ry, 0]);

    pyramid.update = function () {
        let now = Date.now();
        let deltat = now - this.currentTime;
        this.currentTime = now;
        let fract = deltat / duration;
        let angle = Math.PI * 2 * fract;

        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };

    return pyramid;
}

function update() {
    requestAnimationFrame(update);

    draw(glCtx, faces);
    faces.forEach(face => {
        // While paused keep the clock current, so it doesn't jump on resume.
        if (paused) face.currentTime = Date.now();
        else face.update();
    });
}

// The three side faces, each a Sierpinski triangle turned 60, 180 and 300
// degrees around the vertical axis. (The original also built a face of type 0
// with no rotation, which gl-matrix turned into NaN, so it was never drawn.)
function buildFaces(faceLevel) {
    let previous = faces;
    faces = [1, 2, 3].map(type => createPyramid(glCtx, [0, 0, -5], [0, 0.1, 0], type, faceLevel));
    // Keep the current turn when the level changes.
    previous.forEach((old, i) => {
        mat4.copy(faces[i].modelViewMatrix, old.modelViewMatrix);
        glCtx.deleteBuffer(old.buffer);
        glCtx.deleteBuffer(old.colorBuffer);
        glCtx.deleteBuffer(old.indices);
    });
}

// Page controls
function setLevel(n) {
    level = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, n));
    buildFaces(level);
    return level;
}

function setPaused(value) {
    paused = value;
}

function triangleCount() {
    return 3 * Math.pow(3, level);
}

function main() {
    let canvas = document.getElementById("pyramidCanvas");
    glCtx = initWebGL(canvas);

    initViewport(glCtx, canvas);
    initGL(glCtx, canvas);

    buildFaces(level);

    initShader(glCtx, vertexShaderSource, fragmentShaderSource);

    update();
    if (window.onPyramidReady) window.onPyramidReady();
}