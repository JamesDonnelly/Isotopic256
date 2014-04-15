function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.sharingContainer = document.querySelector(".score-sharing");

  this.tileCounter    = document.querySelector(".tile-counter");
  this.previousCounter = { "2": 0, "4": 0, "8": 0, "16": 0, "32": 0, "64": 0, "128": 0, "256": 0, "512": 0, "1024": 0 };
  this.counter = { "2": 0, "4": 0, "8": 0, "16": 0, "32": 0, "64": 0, "128": 0, "256": 0, "512": 0, "1024": 0 };

  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

    self.updateCounter();
  });
};

HTMLActuator.prototype.updateCounter = function() {
  for (var key in this.counter) {
    var counter = this.counter[key],
        previousCounter = this.previousCounter[key],
        tile;

    if (counter === 0)
      return;

    if (previousCounter === 0) {
      var wrapper   = document.createElement("div");
      var inner     = document.createElement("div");
      var count     = document.createElement("div");

      inner.innerHTML = this.getElement(key);

      this.applyClasses(wrapper, ["counter", "tile-"+key]);
      this.applyClasses(inner, ["element"]);
      this.applyClasses(count, ["count"]);

      wrapper.appendChild(inner);
      wrapper.appendChild(count);
      this.tileCounter.appendChild(wrapper);
    }

    tile = this.tileCounter.querySelector(".tile-"+key);
    count = tile.querySelector(".count");

    count.textContent = counter;

    this.previousCounter[key] = this.counter[key];
  }
}

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continue = function () {
  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "restart");
  }

  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.getElement = function(n) {
    var mass = '<span class="mass">' + n + '</span>';

    switch (+n) {
      case 2:
        return mass + "H";
      case 4:
        return mass + "He";
      case 8:
        return mass + "C";
      case 16:
        return mass + "O";
      case 32:
        return mass + "Mg";
      case 64:
        return mass + "Ni";
      case 128:
        return mass + "Sn";
      case 256:
        return mass + "No";
      default:
        return mass + "?";
    }
  }

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.unstable !== 0)
    classes.push("tile-unstable");

  if (tile.explode)
    classes.push("tile-explode");

  //if (tile.isDud)
    //classes.push("tile-isDud");

  if (tile.value > 256) classes.push("tile-super");

  this.applyClasses(wrapper, classes);


  inner.classList.add("tile-inner");
  inner.innerHTML = this.getElement(tile.value) + (tile.unstable || tile.unstable === "0" ? '<span class="count">' + tile.unstable + '</span>'  : '');

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);
    this.counter[tile.value]++;

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
    this.counter[tile.value]++;
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "You win!" : "Game over!";

  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "end", type, this.score);
  }

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;

  this.clearContainer(this.sharingContainer);
  this.sharingContainer.appendChild(this.scoreTweetButton());
  twttr.widgets.load();
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.scoreTweetButton = function () {
  var tweet = document.createElement("a");
  tweet.classList.add("twitter-share-button");
  tweet.setAttribute("href", "https://twitter.com/share");
  tweet.setAttribute("data-via", "inb4");
  tweet.setAttribute("data-url", "http://jamesdonnelly.github.io/Isotopic256");
  tweet.setAttribute("data-counturl", "http://jamesdonnelly.github.io/Isotopic256");
  tweet.textContent = "Tweet";

  var text = "I scored " + this.score + " points at Isotopic 256, a game where you " +
             "join elements to score high! #isotopic256";
  tweet.setAttribute("data-text", text);

  return tweet;
};
