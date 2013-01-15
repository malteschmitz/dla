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
  function readOptions() {
    width = +$('#width').val();
    height = +$('#height').val();
    offsetX = Math.floor(width/2);
    offsetY = Math.floor(height/2);
    radius = +$('#radius').val();
    highlighted = +$('#highlighted').val();
    zoom = +$('#zoom').val();
    clearCanvas();
    return false
  }

  function clearCanvas() {
    // set dimensions of canvas
    canvas.css({
      width: zoom*width + 'px',
      height: zoom*height + 'px'
    });
    canvas.attr('width', width);
    canvas.attr('height', height);
    // clear everthing
    var context = canvas[0].getContext('2d');
    context.clearRect(0, 0, width, height);
    //draw circle with radius
    context.strokeStyle = 'orange';
    context.beginPath();
    context.arc(offsetX, offsetY, radius, 0, Math.PI * 2, true);
    context.stroke();
  }
  
  function drawPoint (point, color) {
    var context = canvas[0].getContext('2d');
    context.fillStyle = color;
    context.fillRect(point[0] + offsetX, point[1] + offsetY, 1, 1);
  }

  function addPoint (point, value) {
    if (oldPoints.length > highlighted) {
      var oldPoint = oldPoints.shift();
      drawPoint(oldPoint, 'black');
    }
    grid[point[0] + point[1] * width] = value;
    oldPoints.push(point);
    drawPoint(point, 'red');
  }

  function cleanAllPoints () {
    for (var key in oldPoints) {
      var point = oldPoints[key];
      drawPoint(point, 'black');
    }
    oldPoints = [];
  }

  function computePoint () {
    while (true) {
      // compute start point
      var alpha = Math.random() * Math.PI * 2;
      var x = Math.round(radius * Math.cos(alpha));
      var y = Math.round(radius * Math.sin(alpha));
      // diffuse it
      while (x >= -offsetX && x <= width - offsetX && y >= -offsetY && y <= height - offsetY) {
        var dx = Math.floor(Math.random() * 3) - 1;
        var dy = Math.floor(Math.random() * 3) - 1;
        x += dx;
        y += dy;
        if (grid[x - 1 + y * width] || grid[x + 1 + y * width] || grid[x + (y - 1) * width] || grid[x + (y + 1) * width]) {
          return [x, y];
        }
      }
    }
  }

  function step () {
    if (run) {
      var point = computePoint();
      if (Math.sqrt(point[0] * point[0] + point[1] * point[1]) < radius) {
        addPoint(point, true);
        window.setTimeout(step, 0);
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
    clearCanvas();
    // place a seed at the center of the grid
    addPoint([0, 0], true);
    // run first step
    window.setTimeout(step, 0);
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
  $('#options').submit(readOptions);
  readOptions();
});
