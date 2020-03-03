const cvs = document.getElementById("my-canvas");
const ctx = cvs.getContext("2d");

const startBtn = document.getElementById("start");

const DEGREE = Math.PI / 180;
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

cvs.addEventListener("click", function (event) {
    switch (state.current) {
        case state.game:
            if (ball.dY - ball.radius <= 0) return;
            ball.flap();
            FLAP.play();
            break;
    }
});

// BACKGROUND
const bg = {
    sx: 3,
    sy: 81,
    sw: 970,
    sh: 600,
    dx : 0,
    dy: 0,

    w : 800,
    h : 600,
    nx : 2,

    draw: function () {
        if (state.current == state.start) {
            ctx.fillStyle = "#ecdfc8";
            ctx.fillRect;
        } else {
            ctx.drawImage(sprite, this.sx, this.sy, this.sw, this.sh, this.dx, this.dy, this.sw, this.h);

            ctx.drawImage(sprite, this.sx, this.sy, this.sw, this.sh, this.dx + this.sw, this.dy, this.sw, this.h);
        }
    },
    update: function() {
        if(state.current == state.game){
            this.dx = (this.dx - this.nx) % 970;
        }
    }
}

// BALL
const ball = {
    sx: 0,
    sy: 0,
    dX: 150,
    dY: 150,
    
    wh: 80,

    radius: 40,

    gravity: 0.25,
    jump: 4.6,
    speed: 0,
    rotation: 0,

    draw: function () {
        if (state.current == state.start) {
            ctx.drawImage(sprite, this.sx, this.sy, this.wh, this.wh, cvs.width/2 - this.wh / 2, cvs.height/2 - this.wh / 2, 100, 100);
        } else {
            ctx.save();
            ctx.translate(this.dX, this.dY);
            ctx.rotate(this.rotation);

            ctx.drawImage(sprite, this.sx, this.sy, this.wh, this.wh, - this.wh / 2, - this.wh / 2, this.wh, this.wh);

            ctx.restore();
        }

    },
    update: function () {
        
        if (state.current == state.start) {
            this.dY = 150; // RESET POSITION OF THE BALL AFTER GAME OVER
            this.rotation = 0 * DEGREE;
        } else {
            this.speed += this.gravity;
            this.dY += this.speed;

            if (this.dY + this.wh / 2 >= cvs.height - 81) {
                this.dY = cvs.height - 81 - this.wh / 2;
                if (state.current == state.game) {
                    state.current = state.over;
                    DIE.play();
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
        this.speed = - this.jump;
    },

}

// HOOPS
const hoops = {
    position : [],

    top : {
        sX : 0,
        sY : 700
    },
    bottom:{
        sX : 2,
        sY : 757
    },

    sh : 32,
    sw : 119,
    
    maxYPos : 180,
    nx : 2,

    draw : function() {
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];

            let topYPos = p.y;
            let bottomYPos = p.y + this.sh;

            // top hoop
            ctx.drawImage(sprite, this.top.sX, this.top.sY, this.sw, this.sh, p.x, topYPos, this.sw, this.sh);  
            
            // bottom hoop
            ctx.drawImage(sprite, this.bottom.sX, this.bottom.sY, this.sw, this.sh, p.x, bottomYPos, this.sw, this.sh); 
             
        }
    },
    update: function(){
        if(state.current !== state.game) return;
        
        if(frames%180 == 0){
            this.position.push({
                x : cvs.width,
                y : this.maxYPos * ( Math.random() + 1)
            });
        }
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];
            
            // COLLISION DETECTION BOTTOM HOOP
            // function clamp(val, min, max) {
            //     return Math.max(min, Math.min(max, val))
            // };
            // const closestX = clamp(ball.dX, this.p.x, this.p.x, + this.sw);
	        // const closestY = clamp(ball.dY, this.p.y, this.p.y + this.sh);

            // const distanceX = closestX - this.p.x;
            // const distanceY = closestY - this.p.y;
            
            // const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

            // if (distanceSquared < (this.radius * this.radius)) {
            //     state.current = state.game;
            // } else {
            //     state.current = state.over;
            // }
            
            // MOVE THE Hoop TO THE LEFT
            p.x -= this.nx;

            // if the hoops go beyond canvas, we delete them from the array
            if(p.x + this.dw <= 0){
                this.position.shift();
                
            }
           
        }
    },
}

// GAME OVER MESSAGE
const gameOver = {
    sx: 425,
    sy: 685,
    w: 390,
    h: 270,
    x: cvs.width / 2 - 390 / 2,
    y: 90,

    draw: function () {
        if (state.current == state.over) {
            ctx.drawImage(sprite, this.sx, this.sy, this.w, this.h, this.x, this.y, this.w, this.h);
        }
    }

}

startBtn.addEventListener("click", function () {
    state.current = state.game;
})

function draw() {
    ctx.fillStyle = "#ecdfc8";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    bg.draw();
    ball.draw();
    hoops.draw();
    gameOver.draw();
};

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
