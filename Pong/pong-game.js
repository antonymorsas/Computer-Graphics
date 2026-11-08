let ctx = null;
let canvas = null;

let game = null;
let hud = null;
let menu = null;
let ball = null;
let player = null;
let player2 = null;
//let particles = []

// Pixel font from Google Fonts (loaded in index.html).
const PIXEL_FONT = "'Press Start 2P', monospace";

// Main Functions ********************************************
function main() {
    // Wait for the pixel font: the menu measures its buttons with it.
    if (document.fonts && !main.fontReady) {
        main.fontReady = true;
        document.fonts.load("16px 'Press Start 2P'").then(main, main);
        return;
    }
    //Canvas
    canvas = document.querySelector("#ballCanvas");
    ctx = canvas.getContext("2d");
    ctx.font = "16px " + PIXEL_FONT;
    // Make the objects
    game = new Game();
    hud = new Hud();
    menu = new Menu();
    ball = new Sphere(canvas.width / 2, canvas.height / 2); //x,y
    player = new Paddle(20, canvas.height / 2, 15, 80); //x,y,w,h
    player2 = new Paddle(canvas.width - 35, canvas.height / 2, 15, 80); //x,y,w,h
    //Events
    menuEvents(menu);
    ballState(ball)
    // Update and Draw
    _update();
    _draw();
}

function _update() {
    requestAnimationFrame(() => _update());
    //ctx.clearRect(0, 0, canvas.width, canvas.height);

    game.update();
    // Game States
    if (game.state == "menu") {
        menu.update();
    } else if (game.state == "game") {
        ball.update(canvas.width, canvas.height);
        player.update(canvas.width, canvas.height);
        player2.update(canvas.width, canvas.height);
        hud.update()
        //if (game.changeHud) hud.update()
    }
}

function _draw() {
    requestAnimationFrame(() => _draw());
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Game States
    if (game.state == "menu") {
        menu.draw();
    } else if (game.state == "game") {
        ball.draw();
        player.draw();
        player2.draw();
        hud.draw();
    }
}

// Objects ********************************************
// Game manager singleton
class Game {
    constructor() {
        if (!!Game.instance) return Game.instance;
        Game.instance = this;

        this.state = "menu";
        this.inMatch = false;
        this.p1Score = 0;
        this.p2Score = 0;
        this.inGamePlayers = 0; //How much payers in the game (0 means 2 bots)
        this.autoStartTime = 3; //If only bots in the game
        this.autoStartTimeActual = new Date(); //If only bots in the game
        this.mousePos = {
            x: 0,
            y: 0,
            w: 0,
            h: 0
        } // w & h to make it compatible with overlap function(helpers.js) 
        this.audioManager = document.createElement("audio");
        return this;
    }

    update(){
        if(this.state=="game" && !this.inMatch && this.inGamePlayers <= 0){
            // Auto start match counter (only if all players are bots)
            if ((new Date() - this.autoStartTimeActual) / 1000 > this.autoStartTime) {
                this.startMatch()
            }
        }
    }

    setMatch() {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.stiky = true;
        player.y = (canvas.height / 2) - (player.h / 2)
        player.dy = 0
        player2.y = (canvas.height / 2) - (player.h / 2)
        player2.dy = 0
        this.inMatch = false;
        this.autoStartTimeActual = new Date()
    }

    startGame(gameType) {
        switch (gameType) {
            case 0:
                movePlayer(player);
                this.inGamePlayers = 1;
                break;
            case 1:
                movePlayer(player);
                movePlayer(player2);
                this.inGamePlayers = 2;
                break;
            case 2:
                this.autoStartTimeActual = new Date();
                break;
            default: //Error default case 1 player
                movePlayer(player);
                this.inGamePlayers = 1;
                break;
        }
        this.state = "game";
    }

    startMatch() {
        ball.stiky = false;
        this.inMatch = true;
        ball.dx = randomRange(0, 1) == 0 ? ball.speed : -ball.speed;
        ball.dy = randomRange(0, 1) == 0 ? ball.speed : -ball.speed;
        //Audio sound
        game.audioManager.src = "audio/startMatch.wav";
        game.audioManager.volume = 1;
        game.audioManager.play();
    }

    gameOver() {
        this.state = "gameOver";
    }
}

class Sphere {
    constructor(x, y) {
        this.color = 'salmon';
        this.x = x;
        this.y = y;
        this.dx = -3;
        this.dy = 3;
        this.radius = 10;
        this.stiky = true; //ball can't move
        this.speed = 3.5;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    update(xLimit, yLimit) {
        //Canvas bounce
        /*if ( this.x < this.radius || this.x + this.radius > xLimit) this.dx = -this.dx;*/
        if (this.y + this.radius > yLimit || this.y < this.radius) {
            this.dy = -this.dy;
            game.audioManager.src = "audio/hit.wav";
            game.audioManager.volume = 0.2;
            game.audioManager.play();
        }
        // Paddle colission
        if (onCollideBall(this, player) || onCollideBall(this, player2)) {
            game.audioManager.src = "audio/hitPaddle.wav";
            game.audioManager.volume = 0.2;
            game.audioManager.play();

            if (onCollideBall(this, player)) {
                //Colide with X paddle position
                if (!deflectY(this, player)) {
                    this.dx = -this.dx;
                } //Colide with X paddle position
                else {
                    this.dy = -this.dy
                }
            } else {
                //Colide with X paddle1 position
                if (!deflectY(this, player2)) {
                    this.dx = -this.dx;
                } //Colide with X paddle position
                else {
                    this.dy = -this.dy
                }
            }

        }

        //Game points
        if (this.x + this.radius < 0) {
            game.p2Score++;
            game.audioManager.src = "audio/point.wav";
            game.audioManager.volume = 0.3;
            game.audioManager.play();
            game.setMatch();
        }
        if (this.x - this.radius > xLimit) {
            game.p1Score++;
            game.audioManager.src = "audio/point.wav";
            game.audioManager.volume = 0.3;
            game.audioManager.play();
            game.setMatch();
        }

        // Stick the ball
        if (this.stiky) {
            this.dx = 0;
            this.dy = 0;
        }
        // Update ball position
        this.x += this.dx;
        this.y += this.dy;
    }

}

class Paddle {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y - (h / 2);
        this.w = w;
        this.h = h;
        this.dx = 0;
        this.dy = 0;
        this.speed = 3;
        this.color = "white";
        this.bot = true
        this.botMultiplierSpeed = 0.91 // 1 equal player speed / 1.5 is 150% player speed
    }

    update(xLimit, yLimit) {
        //Update Paddle position
        this.x += this.dx;
        this.y += this.dy;
        this.y = clamp(this.y, 0, yLimit - this.h)

        if (this.bot) this.botMovement();
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.closePath();
    }

    // NPC Logic
    botMovement() {
        // If the ball is in his half then can move
        if (Math.abs((this.x + (this.w / 2)) - ball.x) < canvas.height - 35) {
            //Detect the y psosition of the ball
            if (ball.y < this.y + (this.h / 2)) {
                this.dy = -this.speed * (this.botMultiplierSpeed);
            } else if (ball.y > this.y + (this.h / 2)) {
                this.dy = this.speed * (this.botMultiplierSpeed);
            } else {
                this.dy = 0
            }
        } else {
            this.dy = 0
        }
    }
}

class Hud {
    constructor() {
        this.p1 = game.p1Score;
        this.p2 = game.p2Score;
        this.instructions = true;
        this.instructionsColor = "#898989";
        this.blinkCounter = new Date(); //Time in seconds
    }

    update() {
        this.p1 = game.p1Score;
        this.p2 = game.p2Score;

        this.instructions = game.inMatch ? false : true;

        //player can  see instructions 
        if (this.instructions) {
            // Blink counter
            if ((new Date() - this.blinkCounter) / 1000 > 0.5) {
                if (this.instructionsColor == "#898989") {
                    this.instructionsColor = "white"
                } else {
                    this.instructionsColor = "#898989"
                }
                this.blinkCounter = new Date()
            }
        }
    }

    draw() {
        // Dashed net down the middle
        ctx.fillStyle = "#3a3a3a";
        for (let y = 8; y < canvas.height; y += 28) ctx.fillRect(canvas.width / 2 - 3, y, 6, 16);

        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "28px " + PIXEL_FONT;
        ctx.fillText(this.p1, (canvas.width / 2) - 80, 48);
        ctx.fillText(this.p2, (canvas.width / 2) + 80, 48);

        //player can  see instructions 
        if (this.instructions) {
            if(game.inGamePlayers <= 0){
                let lt = 3-(Math.round((new Date() - game.autoStartTimeActual) / 1000))
                ctx.fillStyle = this.instructionsColor;
                ctx.font = "12px " + PIXEL_FONT;
                ctx.fillText(t("MATCH START IN ", "EMPIEZA EN ") + lt, canvas.width / 2, canvas.height-90);
            }

            // One player in game
            if(game.inGamePlayers > 0){
                ctx.fillStyle = this.instructionsColor;
                ctx.font = "12px " + PIXEL_FONT;
                ctx.fillText(t("SPACE TO SERVE", "ESPACIO PARA SACAR"), canvas.width / 2, canvas.height-90);
                ctx.fillText(t("W UP", "W ARRIBA"), 60, canvas.height-90);
                ctx.fillText(t("S DOWN", "S ABAJO"), 60, canvas.height-65);
            }
            // Two player in game
            if(game.inGamePlayers > 1){
                ctx.fillStyle = this.instructionsColor;
                ctx.font = "12px " + PIXEL_FONT;
                ctx.fillText(t("↑ UP", "↑ ARRIBA"), canvas.width-60, canvas.height-90);
                ctx.fillText(t("↓ DOWN", "↓ ABAJO"), canvas.width-60, canvas.height-65);
            }
        }
    }
}

class Menu {
    constructor() {
        this.mainText = "PONG"
        this.activeButton = null;
        this.buttonsPos = {
            x: 0, // each button is centered below
            y: (canvas.height/2) -40
        }
        this.margin = {
            x: 0,
            y: 56
        }
        this.buttons = [{
                id: 0,
                // Spanish without accents: the pixel font squeezes them.
                text: t("Player vs NPC", "Jugador vs NPC"),
                x: this.buttonsPos.x,
                y: this.buttonsPos.y,
                w: ctx.measureText("Player vs NPC").width,
                h: 30,
                color: "#e0e0e0"
            },
            {
                id: 1,
                text: t("Player vs Player", "Jugador vs Jugador"),
                x: this.buttonsPos.x + (this.margin.x * 1),
                y: this.buttonsPos.y + (this.margin.y * 1),
                w: ctx.measureText("Player vs Player").width,
                h: 30,
                color: "#e0e0e0"
            },
            {
                id: 2,
                text: t("NPC vs NPC", "NPC vs NPC"),
                x: this.buttonsPos.x + (this.margin.x * 2),
                y: this.buttonsPos.y + (this.margin.y * 2),
                w: ctx.measureText("Player vs Player").width,
                h: 30,
                color: "#e0e0e0"
            }
        ]
        // Center each button and make its hit box a bit taller than the text.
        this.buttons.forEach(btn => {
            btn.w = ctx.measureText(btn.text).width;
            btn.x = (canvas.width - btn.w) / 2;
            btn.y -= 8;
            btn.h = 32;
        });
    }

    update() {
        let a = overlap(game.mousePos, this.buttons[0])
        let b = overlap(game.mousePos, this.buttons[1])
        let c = overlap(game.mousePos, this.buttons[2])

        if (a || b || c) {
            if (a) this.activeButton = 0;
            else if (b) this.activeButton = 1;
            else if (c) this.activeButton = 2;
            document.documentElement.style.cursor = "pointer";
        } else {
            document.documentElement.style.cursor = "default";
            this.activeButton = null;
        }

        this.buttons.forEach(btn => {
            if(btn.id==this.activeButton) btn.color= "#ffd23f"
            else  btn.color= "#e0e0e0"
        });
    }

    draw() {
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.font = "64px " + PIXEL_FONT;
        ctx.fillStyle = "#ff4f9a";
        ctx.fillText(this.mainText, canvas.width / 2 + 6, 136);
        ctx.fillStyle = "#ffd23f";
        ctx.fillText(this.mainText, canvas.width / 2, 130);

        ctx.textAlign = "left";
        ctx.textBaseline = 'top';
        ctx.font = "16px " + PIXEL_FONT;
        this.buttons.forEach(btn => {
            ctx.fillStyle = btn.color;
            // Arrow on the hovered option, like an arcade menu
            if (btn.id == this.activeButton) ctx.fillText("▶", btn.x - 32, btn.y + 8);
            ctx.fillText(btn.text.toUpperCase(), btn.x, btn.y + 8);
            //ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        });
        ctx.textBaseline = 'alphabetic';

        ctx.textAlign = "center";
        ctx.font = "8px " + PIXEL_FONT;
        ctx.fillStyle = "#898989";
        ctx.fillText("ANTONY999K", canvas.width / 2, canvas.height - 18);
    }
}