(function(){
    var skip = function() {
        return false;
    };

    var assertHandler = function(event) {
        if (!/^json:/.test(event.data)) {
            return;
        }

        var jsonData = event.data.slice(5);
        var data = JSON.parse(jsonData);

        if (data.assert !== true) {
            return;
        }

        var method = data.method;
        var args = data.args;

        QUnit[method].apply(QUnit, args);
    };

    var currentWin, currentDoc;

    var assertCapturing = function() {
        equal(currentDoc.getElementsByTagName("plaintext").length, 1, "Plaintext element should exist");
        equal(currentDoc.getElementById("content"), null, "#content should not exist");
    };

    var assertNotCapturing = function() {
        equal(currentDoc.getElementsByTagName("plaintext").length, 0, "Plaintext element should not exist");
        notEqual(currentDoc.getElementById("content"), null, "#content should exist");
    };

    var assertLoaded = function(path) {
        equal(currentWin.mobifyjsFileName, path, "Should load expected file.")
    }

    var testSetup = function(src, ready, beforeLoad) {
        var opts = {
            id: "tag-test.html",
            src: src
        };
        var $iframe = $("<iframe>", opts);
        var el = $iframe[0];

        // Clear cookies
        document.cookie = 'mobify-path=' +
            '; expires=' + (new Date(Date.now() - 1000)).toGMTString() +
            '; path=/';

        document.cookie = 'mobify-mode=' +
            '; expires=' + (new Date(Date.now() - 1000)).toGMTString() +
            '; path=/';

        window.addEventListener("message", function onMessage(event) {
            if (event.source != el.contentWindow || event.data !== "ready") return;
            window.removeEventListener("message", onMessage, false);
            var win = currentWin = el.contentWindow;
            var doc = currentDoc = el.contentWindow.document;

            setTimeout(function() {
                if (skip()) {
                    ok(true, "Test harness does not work. Must be tested manually.");
                    return start();
                }

                // Call ready so we can fire assertions
                ready(win, doc, event);
            }, 100);
        }, false);

        window.addEventListener("message", assertHandler, false);

        if (beforeLoad) { beforeLoad(el) };

        $("#qunit-fixture").append($iframe);
    };

    module("Tag: Disable");

    asyncTest("Set to disabled when build cannot be loaded", function() {
        testSetup("/tests/fixtures/tag/onerror.html", function(win, doc, event) {
            equal(win.Mobify.Tag.Private.isDisabled(), true, "onerror refreshs and opts out.");

            start();
        });
    });

    asyncTest("Set to disabled when build cannot be loaded, with hash", function() {
        testSetup("/tests/fixtures/tag/onerror.html#withhash", function(win, doc, event) {
            equal(win.Mobify.Tag.Private.isDisabled(), true, "onerror refreshs and opts out.");

            start();
        });
    });

    asyncTest("isDisabled detects `mobify-path=` in cookie.", function() {
        testSetup("/tests/fixtures/tag/no-run.html", function(win, doc, event) {
            equal(win.Mobify.Tag.Private.isDisabled(), true, "Disabled condition detected.");

            start();
        }, function (el) {
            document.cookie = "mobify-path=; path=/";
        });
    });

    module("Tag: Preview");
    asyncTest("isPreview detects `mobify-path=true` in hash.", function() {
        testSetup("/tests/fixtures/tag/no-run.html#mobify-path=true&foo", function(win, doc, event) {
            equal(win.Mobify.Tag.Private.isPreview(), true, "Preview condition detected.");

            start();
        });
    });

    asyncTest("isPreview detects `mobify-path=true` in cookie.", function() {
        testSetup("/tests/fixtures/tag/no-run.html", function(win, doc, event) {
            equal(win.Mobify.Tag.Private.isPreview(), true, "Preview condition detected.");

            start();
        }, function (el) {
            document.cookie = "mobify-path=true; path=/";
        });
    });

    asyncTest("isPreview does not trigger without cookie or hash.", function() {
        testSetup("/tests/fixtures/tag/no-run.html", function(win, doc, event) {
            equal(win.Mobify.Tag.Private.isPreview(), false, "Preview condition not detected.");

            start();
        });
    });

    module("Tag: Mobify Properties");

    asyncTest("Mobify.points exists", function() {
        testSetup("/tests/fixtures/tag/no-run.html?tag=min", function(win, doc, event) {
            equal(win.Mobify.points.length, 1, "Mobify.points is an array");
            equal(typeof win.Mobify.points[0], "number", "Mobify.point[0] is a number");

            start();
        });
    });

    asyncTest("Mobify.tagVersion exists", function() {
        testSetup("/tests/fixtures/tag/no-run.html?tag=min", function(win, doc, event) {
            deepEqual(win.Mobify.tagVersion, [7, 0], "Mobify.tagVersion exists");

            start();
        });
    });

    asyncTest("Mobify.userAgent exists", function() {
        testSetup("/tests/fixtures/tag/no-run.html?tag=min", function(win, doc, event) {
            equal(win.Mobify.Tag.ua, window.navigator.userAgent, "Mobify.userAgent exists");

            start();
        });
    });

    asyncTest("Mobify.Tag.getOptions exists", function() {
        testSetup("/tests/fixtures/tag/no-run.html", function(win, doc, event) {
            equal(typeof win.Mobify.Tag.getOptions, "function", "Mobify.Tag.getOptions() exists");

            start();
        });
    });

    module("Tag: Capturing");

    asyncTest("Always-Run: Capturing Fires", function() {
        testSetup("/tests/fixtures/tag/always-run.html?tag=min", function(win, doc, event) {
            assertCapturing();
            assertLoaded("/tests/fixtures/tag/mobile.js");

            start();
        });
    });

    asyncTest("Always-Run: Mobify.Tag.options exists", function() {
        testSetup("/tests/fixtures/tag/always-run.html?tag=min", function(win, doc, event) {
            equal(typeof win.Mobify.Tag.options.mobile, "object", "Mobify.Tag.options exists")

            start();
        });
    });

    asyncTest("Unmobifies Correctly", function() {
        testSetup("/tests/fixtures/tag/failed-load-tag.html?tag=min", function(win, doc, event) {
            assertNotCapturing();

            start();
        });
    });

    asyncTest("Loads Desktop Correctly", function() {
        testSetup("/tests/fixtures/tag/desktop.html?tag=min", function(win, doc, event) {
            assertNotCapturing();
            assertLoaded("/tests/fixtures/tag/desktop.js");

            start();
        });
    });

    asyncTest("Loads mobile correctly when forced via `mode` cookie", function() {
        testSetup("/tests/fixtures/tag/desktop.html?tag=min", function(win, doc, event) {
            assertCapturing();
            assertLoaded("/tests/fixtures/tag/mobile.js");

            start();
        }, function (el) {
            document.cookie = "mobify-mode=mobile; path=/";
        });
    });

    asyncTest("Loads mobile correctly via correct userAgent", function() {
        testSetup("/tests/fixtures/tag/useragent.html?tag=min", function(win, doc, event) {
            assertCapturing();
            assertLoaded("/tests/fixtures/tag/mobile.js");

            start();
        });
    });

    asyncTest("Single-mode loads", function() {
        testSetup("/tests/fixtures/tag/single-mode.html?tag=min", function(win, doc, event) {
            assertCapturing();
            assertLoaded("/tests/fixtures/tag/mobile.js");

            start();
        });
    });

    asyncTest("Fires preload callback", function() {
        testSetup("/tests/fixtures/tag/preload.html?tag=min", function(win, doc, event) {
            // All assertions are fired in the iframe.
            expect(2);

            start();
        });
    });

    asyncTest("Fires postload callback", function() {
        testSetup("/tests/fixtures/tag/postload.html?tag=min", function(win, doc, event) {
            // All assertions are fired in the iframe.

            expect(2);

            start();
        });
    });

    
    module("Tag: Disable");

    asyncTest("Capturing does not fire if disabled.", function() {
        testSetup("/tests/fixtures/tag/disabled.html?tag=min", function(win, doc, event) {
            assertNotCapturing();

            start();
        }, function (el) {
            document.cookie = "mobify-path=; path=/";
        });
    });

    module("Tag: Preview");

    asyncTest("Loads preview correctly", function() {
        testSetup("/tests/fixtures/tag/preview.html?tag=min#mobify-path=true", function(win, doc, event) {
            assertCapturing();
            assertLoaded("/tests/fixtures/tag/preview.js");

            start();
        });
    });

    asyncTest("Skips preview if skipPreview is set.", function() {
        // Test on Open Source
        testSetup("/tests/fixtures/tag/skip-preview.html?tag=min#mobify-path=true", function(win, doc, event) {
            assertCapturing();
            assertLoaded("/tests/fixtures/tag/mobile.js");

            start();
        });
    });

    module("Tag: Time Tracking");
    asyncTest("Time tracking happens when capturing.", function() {
        testSetup("/tests/fixtures/tag/always-run.html?tag=min", function(win, doc, event) {
            ok(win.Mobify.Tag.DOMContentLoaded > 0, "DOMContentLoaded Time is recorded.");
            ok(win.Mobify.Tag.load > 0, "Load Time is recorded.");

            start();
        });
    });

    asyncTest("Time tracking happens when not capturing.", function() {
        testSetup("/tests/fixtures/tag/desktop.html?tag=min", function(win, doc, event) {
            ok(win.Mobify.Tag.DOMContentLoaded > 0, "DOMContentLoaded Time is recorded.");
            ok(win.Mobify.Tag.load > 0, "Load Time is recorded.");

            start();
        });
    });

    module("Tag: Compatiblity");
    asyncTest("Projects 1.0", function() {
        // This test only runs on supported browsers, but not Opera or IE for 1.0.
        if (/trident|opera|firefox/i.test(window.navigator.userAgent)) {
            ok("Browser is not supported for this feature. Test skipped.");
            return start();
        }


        testSetup("/tests/fixtures/tag/project1-0.html?tag=min", function(win, doc, event) {
            var query = doc.querySelectorAll('p.extract');
            var titleEl = query[0];
            var pEl = query[1];

            equal(titleEl.innerHTML, "Title of Page");
            equal(pEl.innerHTML, "First Paragraph");

            start();
        });
    });


    asyncTest("Projects 1.1", function() {
        // This test only runs on supported browsers, but not Opera or IE for 1.1.
        if (/trident|opera/i.test(window.navigator.userAgent)) {
            ok(true, "Browser is not supported for this feature. Test skipped.");
            return start();
        }

        testSetup("/tests/fixtures/tag/project1-1.html?tag=min", function(win, doc, event) {
            var query = doc.querySelectorAll('p.extract');
            var titleEl = query[0];
            var pEl = query[1];

            equal(titleEl.textContent || titleEl.innerHTML, "Title of Page", "Title Found");
            equal(pEl.textContent || pEl.innerHTML, "First Paragraph", "First P Found");

            start();
        });
    });

    asyncTest("Projects 2.0", function() {
        testSetup("/tests/fixtures/tag/project2-0.html?tag=min", function(win, doc, event) {
            expect(2);

            ok(win.elseClauseHit, "Else clause was run.");

            start();
        });
    });
})();