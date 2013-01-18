var Connect = require('connect')
  , server = new Connect().use(Connect.static(process.cwd()))
  , PORT = 1337

server.listen(PORT);
console.log('Mobify.js Testing Server @ http://127.0.0.1:' + PORT);