var express = require('express');
var fs = require('fs');

var server = express();

// Used for test "capture captures the complete document"
// in tests/capture.html
server.get('/tests/fixtures/split.html', function(req, res){
    var split = fs.readFileSync(__dirname + req.path, 'utf8').split('<!-- SPLIT -->')

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(split[0]);

    setTimeout(function() {
        res.write(split[1]);
        res.end();
    }, 5000);
});

//server.listen(3000);
console.log('Listening on port 3000');

module.exports = server;