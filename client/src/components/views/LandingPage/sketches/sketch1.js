import io from 'socket.io-client';
import p5 from 'p5/lib/p5.min';

const sketch = p => {
  var socket;
  var inGame;
  var initClick;
  var countDwn = 0;

  var blob;
  var food;
  var startBtn;

  var Nfoods = [];
  var foods = [];
  var blobs = [];
  var zoom = 1;

  function Blob(x, y, r) {
    this.pos = p.createVector(x, y);
    this.r = r;
    this.vel = p.createVector(0, 0);

    this.update = function() {
      var newvel = p.createVector(
        p.mouseX - p.width / 2,
        p.mouseY - p.height / 2
      );
      // vel.sub(this.pos);
      newvel.setMag(
        (p.abs(p.mouseX - p.width / 2) + p.abs(p.mouseY - p.height / 2)) / 100
      );
      this.vel.lerp(newvel, 0.05);
      this.pos.add(this.vel);
    };

    this.eats = function(other) {
      other.pos = p.createVector(other.x, other.y);
      var d = p5.Vector.dist(this.pos, other.pos);
      if (d < this.r + other.r && this.r > other.r) {
        var sum = p.PI * this.r * this.r + p.PI * other.r * other.r;
        this.r = p.sqrt(sum / p.PI);
        return true;
      } else {
        return false;
      }
    };

    this.eaten = function(other) {
      other.pos = p.createVector(other.x, other.y);
      var d = p5.Vector.dist(this.pos, other.pos);
      if (d < this.r + other.r && this.r < other.r) {
        return true;
      } else {
        return false;
      }
    };

    this.constrain = function() {
      blob.pos.x = p.constrain(blob.pos.x, -p.width, p.width);
      blob.pos.y = p.constrain(blob.pos.y, -p.height, p.height);
    };

    this.show = function(color) {
      p.fill(color);
      p.ellipse(this.pos.x, this.pos.y, this.r * 2, this.r * 2);
    };

    this.counter = function() {
      return Math.round(blob.r);
    };
  }

  function Food(x, y, r) {
    this.pos = p.createVector(x, y);
    this.r = r;
    this.vel = p.createVector(0, 0);

    this.update = function() {
      var newvel = p.createVector(
        p.mouseX - p.width / 2,
        p.mouseY - p.height / 2
      );
      // vel.sub(this.pos);
      newvel.setMag(
        (p.abs(p.mouseX - p.width / 2) + p.abs(p.mouseY - p.height / 2)) / 100
      );
      this.vel.lerp(newvel, 0.05);
      this.pos.add(this.vel);
    };

    this.constrain = function() {
      food.pos.x = p.constrain(food.pos.x, -p.width, p.width);
      food.pos.y = p.constrain(food.pos.y, -p.height, p.height);
    };

    this.show = function(color) {
      p.fill(color);
      p.ellipse(this.pos.x, this.pos.y, this.r * 2, this.r * 2);
    };
  }

  function StartBtn(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.col = p.color(100, 100, 100);
    var click;

    this.overRect = function() {
      if (click) {
      } else {
        if (
          p.mouseX > this.x &&
          p.mouseX < this.x + this.w &&
          p.mouseY > this.y &&
          p.mouseY < this.y + this.h
        ) {
          this.col = p.color(200, 200, 200);
        } else {
          this.col = p.color(100, 100, 100);
        }
      }
    };

    this.show = function() {
      this.overRect();
      p.fill(this.col);
      p.rect(this.x, this.y, this.w, this.h);
      p.fill(0, 0, 0);
      p.text('Start Game', this.x + 50, this.y + 30);
    };

    this.clicked = function() {
      var dx = p.dist(p.mouseX, 0, this.x + this.w / 2, 0);
      var dy = p.dist(p.mouseY, 0, this.y + this.h / 2, 0);
      if (dx < this.w / 2 && dy < this.h / 2) {
        this.col = p.color(250, 250, 250);
        click = true;
        initClick = true;
      }
    };
  }

  p.setup = () => {
    p.createCanvas(600, 600);
    startBtn = new StartBtn(100, 200, 150, 50);
    //disables "context menu" on right click for the canvas
    p.canvas.oncontextmenu = function(e) {
      e.preventDefault();
    };
  };

  function startGame() {
    blobs = [];
    socket = io.connect('http://localhost:5000/');

    blob = new Blob(p.random(p.width), p.random(p.height), p.random(8, 24));
    for (var i = 0; i < 10; i++) {
      var x = p.random(-p.width, p.width);
      var y = p.random(-p.height, p.height);
      Nfoods[i] = new Food(x, y, 10);
      var dataF = {
        x: Nfoods[i].pos.x,
        y: Nfoods[i].pos.y,
        r: Nfoods[i].r
      };
      socket.emit('initFood', dataF);
    }

    food = new Food(p.random(p.width), p.random(p.height), 10);

    var data = {
      x: blob.pos.x,
      y: blob.pos.y,
      r: blob.r
    };

    socket.emit('start', data);

    socket.on('heartbeat', function(data, data2) {
      blobs = data;
      foods = data2;
    });

    initClick = false;
  }

  p.draw = () => {
    if (p.mouseIsPressed) {
      startBtn.clicked();
      if (!inGame && initClick) {
        inGame = true;
        startGame();
      }
    }

    p.background(51);

    if (inGame) {
      p.push();

      p.translate(p.width / 2, p.height / 2);
      let newzoom = 64 / blob.r;
      zoom = p.lerp(zoom, newzoom, 0.05);
      p.scale(zoom);
      p.translate(-blob.pos.x, -blob.pos.y);

      for (var i = blobs.length - 1; i >= 0; i--) {
        var id = blobs[i].id;
        if (id !== socket.id) {
          if (blobs[i].r > blob.r) {
            p.fill(255, 0, 0);
          } else {
            p.fill(0, 0, 255);
          }
          p.ellipse(blobs[i].x, blobs[i].y, blobs[i].r * 2, blobs[i].r * 2);

          p.fill(255);
          p.textAlign(p.CENTER);
          p.textSize(4);
          p.text(blobs[i].id, blobs[i].x, blobs[i].y + blobs[i].r * 1.5);

          // New code:
          if (blob.eats(blobs[i])) {
            // blobs.splice(i, 1);
            var data3 = blobs[i].id;
            socket.emit('eaten', data3, function(abc) {
              data3 = abc;
            });
          }
        }
        if (blob.eaten(blobs[i])) {
          inGame = false;
          socket.disconnect();
          countDwn = 0;
          console.log('eaten by ' + i);
          console.log('disconecting socket...');
          return;
        }
      }

      for (var i = foods.length - 1; i >= 0; i--) {
        p.fill(255, 255, 0);
        p.ellipse(foods[i].x, foods[i].y, foods[i].r);

        if (blob.eats(foods[i])) {
          var data2 = i;
          // var data2 = null;
          foods.splice(i, 1);
        }
      }

      var color = [255, 255, 255];
      blob.show(color);
      if (p.mouseIsPressed) {
        blob.update();
      }
      blob.constrain();

      var data = {
        x: blob.pos.x,
        y: blob.pos.y,
        r: blob.r
      };
      socket.emit('update', data, data2);

      data2 = null;
      p.pop();

      //score
      p.fill(0);
      p.rect(0, 0, 100, 100);
      p.textAlign(p.CENTER);
      p.textSize(18);
      p.fill(255);
      p.text('score', 50, 30);
      p.text(blob.counter(), 50, 70);

      //     //chat
      //     p.fill(130);
      //     p.rect(0, 500, 600, 100);
      //     p.fill(120);
      //     p.rect(0, 580, 600, 20);
      //     p.fill(0, 80, 0);
      //     p.textSize(10);
      //     p.textAlign(p.LEFT);
      //     p.textStyle(p.BOLD);
      //     p.text('Blob1: This area is for the chats :)', 10, 515);
      //     p.text('Blob2: Hello World', 10, 535);
      //     p.text('Blob3: Whats up?', 10, 555);
      //     p.text('Blob4: Hi there', 10, 575);
      //     p.fill(80, 80, 80);
      //     p.textStyle(p.ITALIC);
      //     p.text('Blob5: Type message...', 10, 595);

      //     //minimap
      //     p.fill(100);
      //     p.rect(400, 0, 200, 100);

      var elementPos = blobs
        .map(function(x) {
          return x.id;
        })
        .indexOf(socket.id);

      if (elementPos == -1 && inGame) {
        console.log(elementPos);
        countDwn++;
        console.log(countDwn);
        if (countDwn > 10) {
          inGame = false;
          socket.disconnect();
          countDwn = 0;
        }
      }
    } else {
      startBtn.show();
    }
  };
};

export default sketch;
