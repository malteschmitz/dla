// Diffusion-limited aggregation (DLA)
jQuery(function ($) {
  // dimensions of grid
  var width;
  var height;
  // offset of center coordinates
  var offsetX;
  var offsetY;
  // radius of start circle
  var radius;
  // number of highlighted points
  var highlighted;
  // zoom factor
  var zoom;
  // propability that a new point sticks to an existing point
  var stickiness;
  var stickya, stickyb, stickyc;
  // one or two grain version?
  var grain;
  // colors: highlighted, one grain, two grain first, two grain second
  var colors = [];
  // color of the circle
  var colorCircle;
  // select HTML elements
  var canvas = $('#canvas');
  var startButton = $('#start');
  var stopButton = $('#stop');
  var gui = $('#options input, #options button, #start');
  // internal variables
  var grid = {};
  var oldPoints = [];
  var run = false;
  // methods
  function readOptions () {
    width = +$('#width').val();
    height = +$('#height').val();
    offsetX = Math.floor(width / 2);
    offsetY = Math.floor(height / 2);
    radius = +$('#radius').val();
    highlighted = +$('#highlighted').val();
    zoom = +$('#zoom').val();
    stickiness = +$('#stickiness').val();
    stickya = +$('#stickya').val();
    stickyb = +$('#stickyb').val();
    stickyc = +$('#stickyc').val();
    grain = $('#options input[name=grain]:checked').val();
    colors[0] = $('#colorHighlighted').val();
    colors[1] = $('#colorOne').val();
    colors[2] = $('#colorTwoFirst').val();
    colors[3] = $('#colorTwoSecond').val();
    colorCircle = $('#colorCircle').val();
  }

  function clearCanvas () {
    // set dimensions of canvas
    canvas.css({
      width: zoom * width + 'px',
      height: zoom * height + 'px'
    });
    canvas.attr('width', width);
    canvas.attr('height', height);
    // clear everthing
    var context = canvas[0].getContext('2d');
    context.clearRect(0, 0, width, height);
    //draw circle with radius
    if (colorCircle) {
      context.strokeStyle = colorCircle;
      context.beginPath();
      context.arc(offsetX, offsetY, radius, 0, Math.PI * 2, true);
      context.stroke();
    }
  }

  function drawPoint (point, value) {
    var context = canvas[0].getContext('2d');
    context.fillStyle = colors[value];
    context.fillRect(point[0] + offsetX, point[1] + offsetY, 1, 1);
  }

  function addPoint (point, value) {
    if (oldPoints.length > highlighted) {
      var oldPoint = oldPoints.shift();
      drawPoint(oldPoint, grid[oldPoint[0] + oldPoint[1] * width]);
    }
    grid[point[0] + point[1] * width] = value;
    oldPoints.push(point);
    drawPoint(point, 0);
  }

  function cleanAllPoints () {
    for (var key in oldPoints) {
      var point = oldPoints[key];
      drawPoint(point, grid[point[0] + point[1] * width]);
    }
    oldPoints = [];
  }

  function computeStartPoint () {
    var alpha = Math.random() * Math.PI * 2;
    var x = Math.round(radius * Math.cos(alpha));
    var y = Math.round(radius * Math.sin(alpha));
    return [x, y]
  }

  function computePoint () {
    while (true) {
      var p = computeStartPoint();
      var x = p[0], y = p[1];
      var dx, dy;
      // diffuse it
      while (x >= -offsetX && x <= width - offsetX && y >= -offsetY && y <= height - offsetY) {
        do {
          dx = Math.floor(Math.random() * 3) - 1;
          dy = Math.floor(Math.random() * 3) - 1;
        } while (grid[x + dx + (y + dy) * width]);
        x += dx;
        y += dy;
        if (grid[x - 1 + y * width] || grid[x + 1 + y * width] || grid[x + (y - 1) * width] || grid[x + (y + 1) * width]) {
          if (Math.random() < stickiness) {
            return [x, y];
          }
        }
      }
    }
  }

  function computeProp (a, b) {
    if (a == 2 && b == 2) {
      return 1
    }
    if (a == 2 && b == 3) {
      return stickya
    }
    if (a == 3 && b == 2) {
      return stickyb
    }
    if (a == 3 && b == 3) {
      return 1 - stickyc
    }
    return 0
  }

  function computePointTwo (value) {
    while (true) {
      var p = computeStartPoint();
      var x = p[0], y = p[1];
      var dx, dy;
      var p;
      // diffuse it
      while (x >= -offsetX && x <= width - offsetX && y >= -offsetY && y <= height - offsetY) {
        do {
          dx = Math.floor(Math.random() * 3) - 1;
          dy = Math.floor(Math.random() * 3) - 1;
        } while (grid[x + dx + (y + dy) * width]);
        x += dx;
        y += dy;
        if (grid[x - 1 + y * width] || grid[x + 1 + y * width] || grid[x + (y - 1) * width] || grid[x + (y + 1) * width]) {
          p = 0;
          p += computeProp(value, grid[x + (y - 1) * width]);
          p += computeProp(value, grid[x + 1 + y * width]);
          p += computeProp(value, grid[x + (y + 1) * width]);
          p += computeProp(value, grid[x - 1 + y * width]);
          if (Math.random() < p) {
            return [x, y];
          }
        }
      }
    }
  }

  function step () {
    if (run) {
      var point = computePoint();
      if (Math.sqrt(point[0] * point[0] + point[1] * point[1]) < radius) {
        addPoint(point, 1);
        window.setTimeout(step, 0);
      } else {
        stop();
      }
    }
  }

  function stepTwo (value) {
    if (run) {
      var point = computePointTwo(value);
      if (Math.sqrt(point[0] * point[0] + point[1] * point[1]) < radius) {
        addPoint(point, value);
        window.setTimeout(function () {
          stepTwo(value == 2 ? 3 : 2)
        }, 0);
      } else {
        stop();
      }
    }
  }

  function start () {
    gui.attr('disabled', 'disabled');
    stopButton.removeAttr('disabled');
    run = true;
    // reset grid
    grid = {};
    readOptions();
    clearCanvas();
    if (grain == 'one') {
      // place a seed at the center of the grid
      addPoint([0, 0], 1);
      // run first step
      window.setTimeout(step, 0);
    } else if (grain == 'two') {
      // place a seed at the center of the grid
      addPoint([0, 0], 2);
      // run first step
      window.setTimeout(function () {
        stepTwo(2);
      }, 0);
    }
    return false
  }

  function stop () {
    stopButton.attr('disabled', 'disabled');
    gui.removeAttr('disabled');
    run = false;
    cleanAllPoints();
    return false
  }


  stopButton.attr('disabled', 'disabled');
  startButton.removeAttr('disabled');
  stopButton.click(stop);
  startButton.click(start);
  $('#options').submit(function() {
    return false
  });
  readOptions();
  clearCanvas();
});
