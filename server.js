var express = require('express');
var fs = require('fs');
var url = require('url');
var hbs = require('hbs');


var app = express();

app.set('views', __dirname + '/performance');
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

hbs.registerPartial('bootstrap', fs.readFileSync(__dirname + '/tag/bootstrap.html', 'utf8'));

// global controller
app.get('/*',function(req,res,next){
    res.header('Cache-Control' , 'max-age=0, no-cache, no-store');
    next(); // http://expressjs.com/guide.html#passing-route control
});

// Used for test "capture captures the complete document"
// in tests/capture.html
app.get('/tests/fixtures/split.html', function(req, res){
    var split = fs.readFileSync(__dirname + req.path, 'utf8').split('<!-- SPLIT -->')

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(split[0]);

    setTimeout(function() {
        res.write(split[1]);
        res.end();
    }, 5000);
});

app.get('/performance/jazzcat/', function(req, res, next) {
    res.render('jazzcat', {});
});

// Start loading scripts from disk to be used in mock requests
var resourcesUrl = '/mobifyjs/performance/resources/samplescripts/';

var files = fs.readdirSync(__dirname + resourcesUrl).filter(function(folder){
    // filter out hidden folders and files (like .DS_Store)
    return folder[0] !== '.';
});

var scriptsObj = {};
var scriptsArray = [];

for (file in files) {
    if (files.hasOwnProperty(file)) {
        var fileName = files[file];
        var fileData = fs.readFileSync(__dirname + resourcesUrl + files[file], 'utf8');
        scriptsArray.push({'fileName': fileName, 'fileData': fileData});
        scriptsObj[resourcesUrl + fileName] = fileData;
    }
}
// end script load
 

// Jazzcat runner with varying # of scripts
app.get('/performance/jazzcat/runner/:numScripts', function(req, res, next) {
    var numScripts = parseInt(req.params.numScripts);
    var scripts = [];
    for (var i=0; i<numScripts; i++) {
        var index = i%files.length;
        scripts.push(resourcesUrl + scriptsArray[index].fileName + "?" + i)
    }
    res.render('fixtures/jazzcatRunner', {
        mobifyfull: '/mobifyjs/performance/resources/mobify-main-jazzcat.min.js',
        //library: '/mobifyjs/build/mobify.min.js',
        //main: '/mobifyjs/performance/resources/main-jazzcat.js',
        scripts: scripts
    });
});


// Mock Jazzcat jsonp call
app.get('/jsonp/Jazzcat.combo.load/:scripts', function(req, res, next) {
    var scripts = JSON.parse(req.params.scripts);
    var scriptData = scripts.map(function(script){
        var pathname = url.parse(script).pathname;
        return {
            url: script,
            data: JSON.stringify(scriptsObj[pathname])
        }
    });
    //console.log(scriptData);
    res.header('Content-Type', 'application/javascript')
    res.render('fixtures/jazzcatJSONResponse', {
        scripts: scriptData
    })
});

// Mock Jazzcat js call
app.get('/js/Jazzcat.combo.load/:scripts', function(req, res, next) {
    var scripts = JSON.parse(req.params.scripts);
    var scriptData = scripts.map(function(script){
        var pathname = url.parse(script).pathname;
        return scriptsObj[pathname].toString()
    });
    //console.log(scriptData);
    res.header('Content-Type', 'application/javascript')
    res.render('fixtures/jazzcatJSResponse', {
        scripts: scriptData
    })
});

// When running server.js stand-alone (for running on Heroku)
if (!global.runningGrunt) {
    // Grunt does this automatically.
    app.use("/", express.static(__dirname));
    var port = process.env.PORT || 3000;
    app.listen(port);
}

module.exports = app;