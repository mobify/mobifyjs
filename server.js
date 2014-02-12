/**
 * Server for testing Mobify.js!
 */
var http = require('http');
var express = require('express');
var fs = require('fs');
var path = require('path');
var Url = require('url');
var hbs = require('hbs');

http.globalAgent.maxSockets = 100;


/**
 * Inlines the V7 Tag on test fixtures.
 */
var inlineTag = function(req, res, next) {
    try {
        var page = fs.readFileSync(__dirname + req.path, 'utf8');
    } catch (e) {
        return next();
    }

    var tagSource = '/tag/v7.exposed.min.js';
    
    if (req.query['tag'] == "min") {
        tagSource = '/tag/v7.min.js';
    }

    var tag = fs.readFileSync(__dirname + tagSource, 'utf8');

    tag = tag.replace("https://preview.mobify.com/v7/", "/tests/fixtures/tag/preview.js");

    page = page.replace("<script src=\"/tag/v7.js\"></script>", "<script>" + tag + "</script>");

    res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'no-cache'});
    res.end(page);
};


/**
 * Used for test "capture captures the complete document" in `tests/capture.html`.
 */
var slowResponse = function(req, res) {
    var split = fs.readFileSync(__dirname + req.path, 'utf8').split('<!-- SPLIT -->')
    res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
    res.write(split[0]);
    var chunk = 1;
    var iid = setInterval(function() {
        res.write(split[chunk]);
        chunk++;
        if (chunk === split.length){
            clearInterval(iid);
            res.end();
        }
    }, 500);
}

/**
 * Used for test "capture captures the complete document" in `tests/capture.html`.
 */
var cachedResponse = function(req, res, next) {
    res.header('Content-Type', 'application/javascript');
    res.header('Cache-Control', 'max-age=10000');
    next();
}

/**
 * Browser entry point for Jazzcat Performance tests.
 */
var jazzcatPerformanceIndex = function(req, res) {
    res.render('jazzcat', {});
};

/**
 * Main code for jazzcat runners. Passed in as a context variable for the
 * bootstrap tag using toString.
 */
var jazzcatMainExec = function(){
    var capturing = window.Mobify && window.Mobify.capturing || false;
    Jazzcat.httpCache.save = function() {
        return console.log("mocking save to do nothing");
    }
    if (capturing) {
        // Initiate capture
        Mobify.Capture.init(function(capture){

            // Grab reference to a newly created document
            var capturedDoc = capture.capturedDoc;

            var matchType = location.href.match(/responseType=([^&;]*)/);
            var responseType = (matchType && matchType[1]) || 'jsonp';

            var matchConcat = location.href.match(/concat=([^&;]*)/);
            var concat = (matchConcat && matchConcat[1] === 'true');
            if (concat === null) {
                concat = true;
            }

            // Grab all scripts to be concatenated into one request
            if (!/disableJazzcat=1/.test(location.href)) {
                var scripts = capturedDoc.querySelectorAll('script');
                Mobify.Jazzcat.optimizeScripts(scripts, {
                    responseType: responseType,
                    base: '',
                    concat: concat
                });
            }

            // Render source DOM to document
            capture.renderCapturedDoc();
        });
    }
};

/**
 * Page that runs the Jazzcat performance test.
 */
var jazzcatPerformanceRunner = function(req, res) {
    var numScripts = parseInt(req.params.numScripts);
    var scripts = [];

    for (var i = 0; i < numScripts; i++) {
        var index = i % files.length;
        scripts.push(resourcesUrl + scriptsArray[index].fileName + "?" + i);
    }

    // Append timestamp in order to ensure the mobify.js does not always
    // get loaded cached, and also ensures the second load of mobify.js
    // on a test does not load again.
    var library = '/build/mobify.min.js';
    //var library = '/build/mobify.js'; // uncomment for debugging
    library += "?" + new Date().getTime();

    res.header('Connection', 'close');

    res.render('fixtures/jazzcatRunner', {
        library: library,
        main: jazzcatMainExec.toString(),
        scripts: scripts
    });
};

/**
 * Implements the Jazzcat JSONP API.
 */
var jazzcatJsonp = function(req, res) {
    var scripts = JSON.parse(req.params.scripts);
    var scriptData = scripts.map(function(script){
        var pathname = Url.parse(script).pathname;
        return {
            url: script,
            data: JSON.stringify(scriptsObj[pathname])
        }
    });

    res.header('Content-Type', 'application/javascript')
    res.render('fixtures/jazzcatJSONResponse', {scripts: scriptData});
};

/**
 * Implements the Jazzcat JS API.
 */
var jazzcatJs = function(req, res) {

    var scripts = JSON.parse(req.params.scripts);
    var scriptData = scripts.map(function(script){
        var pathname = Url.parse(script).pathname;
        return scriptsObj[pathname].toString()
    });

    res.header('Content-Type', 'application/javascript')
    res.render('fixtures/jazzcatJSResponse', {scripts: scriptData})
};

// Load scripts for the mock mock Jazzcat API.
var resourcesUrl = '/mobifyjs/performance/resources/samplescripts/';
var files = fs.readdirSync(__dirname + resourcesUrl).filter(function(folder) {
    return folder[0] !== '.';
});

var scriptsObj = {};
var scriptsArray = [];

for (file in files) {
    var fileName = files[file];
    var fileData = fs.readFileSync(__dirname + resourcesUrl + files[file], 'utf8');
    scriptsArray.push({fileName: fileName, fileData: fileData});
    scriptsObj[resourcesUrl + fileName] = fileData;
}

hbs.registerPartial('bootstrap', fs.readFileSync(__dirname + '/tag/bootstrap.html', 'utf8'));

/**
 * Image resizing error test cases
 */

var textMime = function(req, res) {
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello, World');
};

var emptyResponse = function(req, res) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.end();
};

var imageData = fs.readFileSync(path.normalize('./examples/assets/images/grumpycat.jpg'));

var wrongMime = function(req, res) {
    res.setHeader('Content-Type', 'image/png');
    res.end(imageData);
};

var partialImage = function(bytes) {
    return function(req, res) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.end(imageData.slice(0, bytes));
    };
};

var abortedImage = function(req, res) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.write(imageData.slice(0, 1024));
    res.socket.destroy();
};

var notFound = function(req, res) {
    res.statusCode = 404;
    res.setHeader('Cotnent-Type', 'text/plain');
    res.end('Not Found!');
};

var serverError = function(req, res) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Faux Internal Server Error');
};

var fakeJPEG = function(req, res) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.end('asdf');
};

var app = express();

app.set('views', __dirname + '/performance');
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(function(req, res, next) {
    res.header('Cache-Control' , 'max-age=0, no-cache, no-store');
    next();
});

app.get('/build/mobify(.min)?.js', cachedResponse);
app.get('/tests/fixtures/split*', slowResponse);
app.get('/tests/fixtures/tag/*', inlineTag);
app.get('/performance/jazzcat/', jazzcatPerformanceIndex);
app.get('/performance/jazzcat/runner/:numScripts', jazzcatPerformanceRunner);

app.get('/jsonp/Jazzcat.load/:scripts', jazzcatJsonp);
app.get('/js/:scripts', jazzcatJs);

app.get('/imagetests/textmime', textMime);
app.get('/imagetests/emptyresponse', emptyResponse);
app.get('/imagetests/wrongmime', wrongMime);
app.get('/imagetests/partialimage100b', partialImage(100));
app.get('/imagetests/partialimage1k', partialImage(1024));
app.get('/imagetests/abortedimage', abortedImage);
app.get('/imagetests/notFound', notFound);
app.get('/imagetests/serverError', serverError);
app.get('/imagetests/fakejpeg', fakeJPEG);

if (require.main === module) {
    app.use(express.static(__dirname));
    app.listen(process.env.PORT || 3000);
}

module.exports = app;
