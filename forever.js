  var forever = require('forever-monitor');

  var child = new (forever.Monitor)('app.js', {
    max: 3
  });

  child.on('exit', function () {
    console.warn('app.js has exited after 3 restarts');
  });

  child.start();
