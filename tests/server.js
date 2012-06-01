var Http = require('http')
  , serve = new (require('node-static').Server)(process.cwd(), {cache: false})
  , handler = function(req, rsp) {
        console.log(req.url);
        return serve.serve(req, rsp);
    }
  , PORT = 1337

Http.createServer(handler).listen(PORT);
console.log('Mobify.js Testing Server @ http://127.0.0.1:' + PORT);