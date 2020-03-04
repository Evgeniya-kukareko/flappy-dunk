const DEBUG = false;

const cvs = document.getElementById("my-canvas");
const ctx = cvs.getContext("2d");

const startBtn = document.getElementById("start");
const userGreetings = document.getElementById("hiUser");

const DEGREE = Math.PI / 180;
const DEAD_LINE = 81;
let frames = 0;

const sprite = new Image();
sprite.src = "img/spritesheet.png";

// LOAD SOUNDS
const SCORE_S = new Audio();
SCORE_S.src = "audio/sfx_point.wav";

const FLAP = new Audio();
FLAP.src = "audio/sfx_flap.wav";

const HIT = new Audio();
HIT.src = "audio/sfx_hit.wav";

const SWOOSHING = new Audio();
SWOOSHING.src = "audio/sfx_swooshing.wav";

const DIE = new Audio();
DIE.src = "audio/sfx_die.wav";

// GAME STATE
const state = {
    current: 0,
    start: 0,
    game: 1,
    over: 2
}

function detectRectCollision(zone1, zone2) {
    if (zone1[0] < zone2[0] + zone2[2] &&
        zone1[0] + zone1[2] > zone2[0] &&
        zone1[1] < zone2[1] + zone2[3] &&
        zone1[1] + zone1[3] > zone2[1]) {
        return true;
    }
    return false;
}

function setGameOver() {
    state.current = state.over;
    DIE.play();
    console.log(scoreBoard.currentScore)

    db.collection("log").doc(user).set({
        score: scoreBoard.currentScore
    },{ merge: true });

}

cvs.addEventListener("click", function (event) {
    switch (state.current) {
        case state.game:
            if (ball.dY - ball.radius() <= 0) return;
            ball.flap();
            FLAP.play();
            break;
    }
});

// USER
let user = "";

// BACKGROUND
const bg = {
    sx: 3,
    sy: 81,
    sw: 970,
    sh: 600,

    dx: 0,
    dy: 0,

    w: 800,
    h: 600,
    nx: 2,

    draw: function () {
        if (state.current === state.start) {
            ctx.fillStyle = "#ecdfc8";
            ctx.fillRect;
        } else {
            ctx.drawImage(sprite, this.sx, this.sy, this.sw, this.sh, this.dx, this.dy, this.sw, this.h);

            ctx.drawImage(sprite, this.sx, this.sy, this.sw, this.sh, this.dx + this.sw, this.dy, this.sw, this.h);
        }
    },
    update: function () {
        if (state.current === state.game) {
            this.dx = (this.dx - this.nx) % 970;
        }
    }
};

// BALL
const ball = {
    // source
    sx: 5,
    sy: 5,
    sw: 70,
    sh: 70,

    dX: 150,
    dY: 150,

    // ball size
    wh: 50,

    // other params
    gravity: 0.25,
    jump: 4.6,
    speed: 0,
    rotation: 0,
    startPosition: 150,

    scoreYPercent: 0.2,

    radius: function () {
        return this.wh / 2;
    },
    draw: function () {
        if (state.current === state.start) {
            // on start screen
            ctx.drawImage(sprite, this.sx, this.sy, this.sw, this.sh, cvs.width / 2 - this.wh / 2, cvs.height / 2 - this.wh / 2, 100, 100);
        } else {
            if (DEBUG) {
                ctx.strokeStyle = 'yellow';
                ctx.beginPath();
                ctx.rect(...this.zone());
                ctx.stroke();

                // score zone
                ctx.fillStyle = 'gold';
                ctx.fillRect(...this.scoreZone());
            }

            ctx.save();
            ctx.translate(this.dX + this.wh / 2, this.dY + this.wh / 2);
            ctx.rotate(this.rotation);

            ctx.drawImage(sprite, this.sx, this.sy, this.sw, this.sh, -this.wh / 2, -this.wh / 2, this.wh, this.wh);

            ctx.restore();
        }

    },
    update: function () {

        if (state.current === state.start) {
            this.dY = this.startPosition; // RESET POSITION OF THE BALL AFTER GAME OVER
            this.rotation = 0;
        } else {
            this.speed += this.gravity;
            this.dY += this.speed;

            if (this.dY + this.wh / 2 >= cvs.height - DEAD_LINE) {
                this.dY = cvs.height - DEAD_LINE - this.wh / 2;
                if (state.current === state.game) {
                    return setGameOver();
                }
            }

            // IF THE SPEED IS GREATER THAN THE JUMP MEANS THE BALL IS FALLING DOWN
            if (this.speed >= this.jump) {
                this.rotation = 90 * DEGREE;

            } else {
                this.rotation = -25 * DEGREE;
            }
        }
    },
    flap: function () {
        this.speed = -this.jump;
    },
    zone: function () {
        return [this.dX, this.dY, this.wh, this.wh];
    },
    scoreZone: function () {
        return [this.dX, this.dY, this.wh, this.wh * this.scoreYPercent];
    }
};

class Hoop {
    enterVisited = false;
    exitVisited = false;
    scored = false;
    width = 119;
    height = 66;

    borderPercent = 0.30;
    enterYPercent = 0.4;
    scoreYPercent = 0.1;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    enterZone() {
        const borderWidth = this.width * this.borderPercent;

        const x = this.x + borderWidth;
        const y = this.y;

        const width = this.width - borderWidth * 2;
        const height = this.height * this.enterYPercent;

        return [x, y, width, height];
    }

    exitZone() {
        const borderWidth = this.width * this.borderPercent;

        const x = this.x + borderWidth;
        const y = this.y + this.height * this.enterYPercent;

        const width = this.width - borderWidth * 2;
        const height = this.height * (1 - this.enterYPercent);

        return [x, y, width, height];
    }

    scoreZone() {
        const borderWidth = this.width * this.borderPercent;

        const x = this.x + borderWidth;
        const y = this.y + this.height * (1 - this.scoreYPercent);

        const width = this.width - borderWidth * 2;
        const height = this.height * this.scoreYPercent;

        return [x, y, width, height];
    }

    hitBox() {
        return [this.x, this.y, this.width, this.height];
    }
}

// HOOPS
const hoops = {
    frequencyRate: 180,

    position: [],

    top: {
        sX: 0,
        sY: 701,
        sw: 119,
        sh: 26,
    },
    bottom: {
        sX: 0,
        sY: 729,
        sw: 119,
        sh: 40,
    },

    maxYPos: 180,
    nx: 2,

    drawTop: function () {
        for (let i = 0; i < this.position.length; i++) {
            const hoop = this.position[i];

            // top hoop
            ctx.drawImage(
                sprite,
                this.top.sX, this.top.sY, this.top.sw, this.top.sh,
                hoop.x, hoop.y, this.top.sw, this.top.sh
            );
        }
    },
    drawBottom: function () {
        for (let i = 0; i < this.position.length; i++) {
            const hoop = this.position[i];

            // bottom hoop
            ctx.drawImage(
                sprite,
                this.bottom.sX, this.bottom.sY, this.bottom.sw, this.bottom.sh,
                hoop.x, hoop.y + this.top.sh, this.bottom.sw, this.bottom.sh
            );

            if (DEBUG) {
                // draw hitbox
                ctx.strokeStyle = 'black';
                ctx.beginPath();
                ctx.rect(...hoop.hitBox());
                ctx.stroke();

                // draw enter zone
                ctx.strokeStyle = 'green';
                ctx.beginPath();
                ctx.rect(...hoop.enterZone());
                ctx.stroke();

                // draw back door zone
                ctx.strokeStyle = 'red';
                ctx.beginPath();
                ctx.rect(...hoop.exitZone());
                ctx.stroke();

                // score zone
                ctx.fillStyle = 'gold';
                ctx.fillRect(...hoop.scoreZone());
            }

        }
    },
    update: function () {
        if (state.current !== state.game) return;

        if (frames % this.frequencyRate === 0) {
            this.position.push(new Hoop(
                cvs.width,
                this.maxYPos * (Math.random() + 1)
            ));
        }

        for (let i = 0; i < this.position.length; i++) {
            const hoop = this.position[i];

            // MOVE THE Hoop TO THE LEFT
            hoop.x -= this.nx;

            if (hoop.x < (ball.dX - ball.wh * 3) && !hoop.scored) {
                return setGameOver();
            }

            if (!hoop.enterVisited && !hoop.exitVisited && detectRectCollision(ball.zone(), hoop.enterZone())) {
                hoop.enterVisited = true;
            } else if (!hoop.exitVisited && detectRectCollision(ball.zone(), hoop.exitZone())) {
                if (hoop.enterVisited) {

                    if (detectRectCollision(ball.scoreZone(), hoop.scoreZone())) {
                        hoop.exitVisited = true;
                        hoop.scored = true;

                        scoreBoard.addScore();
                    }
                } else {
                    hoop.exitVisited = true;
                    return setGameOver();
                }

            }
        }
    },
};

const scoreBoard = {
    bestScore: 0,
    currentScore: 0,
    addScore: function () {
        this.currentScore += 1;
        SCORE_S.play();
    },
    draw: function () {
        ctx.font = "24px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("Score: " + this.currentScore, cvs.width / 2 - 50, 25);
    }
};

// GAME OVER MESSAGE
const gameOver = {
    sx: 425,
    sy: 685,
    w: 390,
    h: 270,
    x: cvs.width / 2 - 390 / 2,
    y: 90,

    draw: function () {
        if (state.current === state.over) {
            ctx.drawImage(sprite, this.sx, this.sy, this.w, this.h, this.x, this.y, this.w, this.h);
        }
    }
};

startBtn.addEventListener("click", function () {
    state.current = state.game;
});

function draw() {
    ctx.fillStyle = "#ecdfc8";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    bg.draw();
    hoops.drawTop();
    ball.draw();
    hoops.drawBottom();
    scoreBoard.draw();
    gameOver.draw();
}

// UPDATE
function update() {
    bg.update();
    ball.update();
    hoops.update();
}

// LOOP
function loop() {
    update();
    draw();
    frames++;

    requestAnimationFrame(loop);
}

loop();

// FIREBASE
var firebaseConfig = {
    apiKey: "AIzaSyAKsxt1CcbzZ9fKDQZYrmmCHVwJsi1eKYY",
    authDomain: "flappy-dunk-3b226.firebaseapp.com",
    databaseURL: "https://flappy-dunk-3b226.firebaseio.com",
    projectId: "flappy-dunk-3b226",
    storageBucket: "flappy-dunk-3b226.appspot.com",
    messagingSenderId: "542960656359",
    appId: "1:542960656359:web:2e3a76f098a42f1b586742"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();

const saveUserBtn = document.getElementById("userNameSaveBtn");
const userNameInput = document.getElementById("userName");

saveUserBtn.addEventListener("click", function() {
    let name = userNameInput.value;

    // проверка на ввод пустой строки 
    if (name === "") {
        return alert("no")
    }

    db.collection("log").doc(name).get().then(function(doc) {
        if (doc.exists) {
            console.log("Document data:", doc.data());
        } else {
            db.collection("log").doc(name).set({
                user: name,
                score: 0
            })
        }
    });
    user = name;
    userGreetings.innerText = "Hi, " + user;
    saveUserBtn.setAttribute("data-dismiss", "modal")
})