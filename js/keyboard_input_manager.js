function KeyboardInputManager() {
  this.events = {};

  this.listen();
}

function getDirection (dy, dx) {
  var angle = Math.atan2 (dy, dx);
  var p = Math.PI / 4;
  if ((-3*p < angle) && (angle < -p)) {
    return 0//3;//left
  }
  else if ((3*p <= angle) || (angle <= -3*p)) {
    return 3//2;//down
  }
  else if ((-p <= angle) && (angle <= p)) {
    return 1//0;//up
  }
  else if ((p <= angle) && (angle <= 3*p)) {
    return 2//1;//right
  }
}

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

KeyboardInputManager.prototype.listen = function () {
  var self = this;

  var map = {
    38: 0, // Up
    39: 1, // Right
    40: 2, // Down
    37: 3, // Left
    75: 0, // vim keybindings
    76: 1,
    74: 2,
    72: 3,
    87: 0, // W
    68: 1, // D
    83: 2, // S
    65: 3  // A
  };

  document.addEventListener("keydown", function (event) {
    var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                    event.shiftKey;
    var mapped    = map[event.which];

    if (!modifiers) {
      if (mapped !== undefined) {
        event.preventDefault();
        self.emit("move", mapped);
      }

      if (event.which === 32) self.restart.bind(self)(event);
    }
  });

  var retry = document.querySelector(".retry-button");
  retry.addEventListener("click", this.restart.bind(this));
  retry.addEventListener("touchend", this.restart.bind(this));

  var keepPlaying = document.querySelector(".keep-playing-button");
  keepPlaying.addEventListener("click", this.keepPlaying.bind(this));
  keepPlaying.addEventListener("touchend", this.keepPlaying.bind(this));
  
  // Listen to swipe events
  var touchStartClientX, touchStartClientY;
  var gameContainer = document.getElementsByClassName("game-container")[0];
  
  gameContainer.addEventListener("touchstart", function (event) {
    if (event.touches.length > 1) return;

    touchStartClientX = event.touches[0].clientX;
    touchStartClientY = event.touches[0].clientY;
    event.preventDefault();
  });
  
  gameContainer.addEventListener("mousedown", function (event) {
    touchStartClientX = event.clientX;
    touchStartClientY = event.clientY;
    gameContainer.classList.remove ("grab");
    gameContainer.classList.add ("grabbing");
    event.preventDefault();
  });
  
  gameContainer.addEventListener("touchmove", function (event) {
    event.preventDefault();
  });

  gameContainer.addEventListener("touchend", function (event) {
    if (event.touches.length > 0) return;

    var dx = event.changedTouches[0].clientX - touchStartClientX;
    var absDx = Math.abs(dx);

    var dy = event.changedTouches[0].clientY - touchStartClientY;
    var absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 10) {
      // (right : left) : (down : up)
      self.emit ("move", getDirection (dy, dx));
    }
  });

  gameContainer.addEventListener("mouseup", function (event) {
    var dx = event.clientX - touchStartClientX;
    var absDx = Math.abs(dx);

    var dy = event.clientY - touchStartClientY;
    var absDy = Math.abs(dy);
                                   
    gameContainer.classList.remove ("grabbing");
    gameContainer.classList.add ("grab");

    if (Math.max(absDx, absDy) > 10) {
      self.emit ("move", getDirection (dy, dx));
    }
  });
};

KeyboardInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};

KeyboardInputManager.prototype.keepPlaying = function (event) {
  event.preventDefault();
  this.emit("keepPlaying");
};
