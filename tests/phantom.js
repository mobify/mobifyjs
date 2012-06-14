var System = require('system')
  , FS = require('fs')
  , fail = 0
  , base = 'http://127.0.0.1:3000/tests/'
  , suites = []
  , results = [];

if (System.args.length > 1) {
    suites = System.args.slice(1);
} else {
    FS.list('tests').forEach(function(path) {
        if (!/html$/.test(path)) return;
        suites.push(path);
    });
}


console.log('[phantomjs] testing:', suites.join(', '))

    /**
     * Call `onReady` after `testFn` is true.
     */
var waitFor = function(testFn, onReady) {
        var start = new Date()
          , interval = setInterval(function() {
                if (testFn()) {
                    clearInterval(interval);
                    onReady();
                } else if (new Date() - start > 1000 * 10) {
                    return done(1, 'Timeout');
                }
            }, 100);
    }

    /**
     * Run the next testsuite.
     */
  , next = function(status) {
        if (!suites.length) return done();

        var url = base + suites.shift();
        
        // console.log('Testing: ' + url)

        page.open(url, function(status) {
            if (status !== 'success') return done(1, "Couldn't open page: " + url);

            waitFor(function() {
                return page.evaluate(function() {
                    var el = document.getElementById('qunit-testresult');
                    return el && el.innerText.match('completed')
                })
            }, function() {
                [].push.apply(results, page.evaluate(function() {
                    try {
                        return [].slice.call(document.getElementById('qunit-tests').childNodes).map(function(el) {
                            return {
                                result: el.className
                              , moduleName: el.getElementsByClassName('module-name')[0].innerHTML
                              , testName: el.getElementsByClassName('test-name')[0].innerHTML
                            }
                        });
                    } catch(err) {
                        return [{
                            result: 'fail'
                          , moduleName: window.location.toString()
                          , testName: 'Unknown'
                        }];
                    }
                }));

                next()
            });
        })
    }

    /**
     * Log results to STDOUT and exit with `code`.
     */
  , done = function(code, msg) {
        if (msg) console.log(msg);

        console.log('<?xml version="1.0" ?>')
        console.log('<testsuites>');
        console.log('  <testsuite>');

        results.forEach(function(result) {
            //console.log(result.result);
            if (result.result == 'fail') {
                console.log('    <testcase classname="' + result.moduleName + '" name="' + result.testName + '">');
                console.log('      <failure/>');
                console.log('    <testcase/>');

                fail = 1;
                return;
            }

            console.log('    <testcase classname="' + result.moduleName + '" name="' + result.testName + '"/>');
        });

        console.log('  </testsuite>');
        console.log('</testsuites>');

        phantom.exit(code || fail)
    }

  , page = require('webpage').create()

// page.onConsoleMessage = function(msg) { console.log('onConsoleMessage', msg) }
// page.onError = function(msg, trace) { console.log('onError:', msg) }

next()