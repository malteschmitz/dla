// Diffusion-limited aggregation (DLA)
jQuery(function ($) {
  // options
  var width = 200;
  // dimensions of grid
  var height = 200;
  var offsetX = 100;
  // offset of center coordinates
  var offsetY = 100;
  var R = 80;
  // radius of start circle
  var highlighted = 10;
  // number of highlighted points
  // select HTML elements
  var canvas = $('#canvas');
  var startButton = $('#start');
  var stopButton = $('#stop');
  if (canvas.length > 0) {
    var grid = {};
    var context = canvas[0].getContext('2d');
    var oldPoints = [];
    var run = false;
    
    function drawPoint (point, color) {
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
        var x = Math.round(R * Math.cos(alpha));
        var y = Math.round(R * Math.sin(alpha));
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
        if (Math.sqrt(point[0] * point[0] + point[1] * point[1]) < R) {
          addPoint(point, true);
          window.setTimeout(step, 0);
        } else {
          stop();
        }
      }
    }
    
    function start () {
      startButton.attr('disabled', 'disabled');
      stopButton.removeAttr('disabled');
      run = true;
      // reset grid
      grid = {};
      // clear everthing
      context.clearRect(0, 0, width, height);
      //draw circle with radius R
      context.strokeStyle = 'orange';
      context.beginPath();
      context.arc(offsetX, offsetY, R, 0, Math.PI * 2, true);
      context.stroke();
      // place a seed at the center of the grid
      addPoint([0, 0], true);
      // run first step
      window.setTimeout(step, 0);
      return false
    }

    function stop () {
      stopButton.attr('disabled', 'disabled');
      startButton.removeAttr('disabled');
      run = false;
      cleanAllPoints();
      return false
    }

    stopButton.attr('disabled', 'disabled');
    startButton.removeAttr('disabled');
    stopButton.click(stop);
    startButton.click(start);
  }
});
