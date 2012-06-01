// TODO: Include a package file in mobify.js
//       that installs node-static.
var http = require('http')
  , static = require('node-static')
  , fileServer = new static.Server(process.cwd(), {cache: false});

var serverHandler = function(req, rsp) {
    console.log(req.url);
    return fileServer.serve(req, rsp);
}


var PORT = 8001;

http.createServer(serverHandler).listen(PORT);

console.log('test-server @ 0.0.0.0:' + PORT);