// https://github.com/madrobby/zepto/blob/master/test/runner.coffee
var System = require('system');

var suites;
var fail = 0;

if (System.args.length > 1) {
    suites = System.args.slice(1)
} else {
    suites = ['http://127.0.0.1:1337/tests/externals.html']
}

function waitFor(testFn, onReady) {
    var start = new Date()
      , interval = setInterval(function() {
            if (testFn()) {
                clearInterval(interval)
                onReady()
            } else if (new Date() - start > 3000) {
                console.log('Timeout.')
                phantom.exit(1)
            }
        }, 100);
}

var page = require('webpage').create()
page.onConsoleMessage = function(msg) { console.log(msg) }
page.onError = function(msg, trace) { console.log(msg) }

function loadNextSuite(status) {
    if (!suites.length) {
        phantom.exit(fail)
    }

    var url = suites.shift();

    page.open(url, function(status) {
        if (status !== 'success') {
            console.log("Couldn't open page: " + url);
            phantom.exit(1);
        }

        waitFor(function() {
            return page.evaluate(function() {
                var el = document.getElementById('qunit-testresult');
                return el && el.innerText.match('completed')
            })
        }, function() {
            var failedNum = page.evaluate(function() {
                    var el = document.getElementById('qunit-testresult');
                    try {
                        return el.getElementsByClassName('failed')[0].innerHTML;
                    } catch (e) { }

                    return 10000;
                });

            fail = fail || (parseInt(failedNum, 10) > 0)
            loadNextSuite()
        });
    })
}

loadNextSuite()