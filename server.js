var express = require('express');
var fs = require('fs');
var hbs = require('hbs');


var server = express();

server.set('views', __dirname + '/performance');
server.set('view engine', 'html');
server.engine('html', require('hbs').__express);

hbs.registerPartial('bootstrap', fs.readFileSync(__dirname + '/tag/bootstrap.html', 'utf8'));

// global controller
server.get('/*',function(req,res,next){
    res.header('Cache-Control' , 'max-age=0, no-cache, no-store');
    next(); // http://expressjs.com/guide.html#passing-route control
});

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

server.get('/performance/jazzcat/', function(req, res, next) {
    res.render('jazzcat', {});
});

var jquery = '/mobifyjs/performance/resources/jquery.js';
var jqueryData = JSON.stringify(fs.readFileSync(__dirname + jquery, 'utf8'));
var underscore = '/mobifyjs/performance/resources/underscore.js';
var underscoreData = JSON.stringify(fs.readFileSync(__dirname + underscore, 'utf8'))

server.get('/performance/jazzcat/runner/:numScripts', function(req, res, next) {
    var numScripts = parseInt(req.params.numScripts);
    var scripts = [];
    for (var i=0; i<numScripts; i++) {
        // alternate between jquery and underscore
        var script = i%2 ? underscore : jquery;
        scripts.push(script + "?" + i)
    }
    res.render('fixtures/jazzcatRunner', {
        mobifypath: '/mobifyjs/performance/resources/mobify-main-jazzcat.min.js',
        scripts: scripts
    });
});

server.get('/jsonp/Jazzcat.combo.load/:scripts', function(req, res, next) {
    var scripts = JSON.parse(req.params.scripts);
    var scriptData = scripts.map(function(script){
        if (script.indexOf(jquery)) {
            return {
                url: script,
                data: jqueryData
            };
        }
        else {
            return {
                url: script,
                data: underscoreData
            };
        }
    });
    //console.log(scriptData);
    res.header('Content-Type', 'application/javascript')
    res.render('fixtures/jazzcatJSONResponse', {
        scripts: scriptData
    })
})

//server.listen(3000);

module.exports = server;