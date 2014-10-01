require(['mobifyjs/patchAnchorLinks'], function(patchAnchorLinks) {
    module("Anchor");
    var skip = function() {
        // Test harness does not work on Android 4.0.x and less because
        // of an iframe scrolling bug. However, the functionality works
        // but needs to be manually tested.
        // Also we don't run these tests in iOS8 because you can't seem
        // to query for the scroll position in iframes.
        return /(android.*(4\.0\.|(2|3)\.\d)|ip(hone|od|ad).*Version\/8.0)|/i.test(window.navigator.userAgent);
    };

    var testSetup = function(id, ready) {
        var opts = {
            id: "anchor-test",
            src: "/tests/fixtures/anchor-test.html"
        };
        var $iframe = $("<iframe>", opts);
        var el = $iframe[0];

        window.addEventListener("message", function onMessage(event) {
            if (event.source != el.contentWindow) return;
            window.removeEventListener("message", onMessage, false);
            var win = el.contentWindow;
            var doc = el.contentWindow.document;

            var triggerClick = function (el) {
                // We have to use this instead of `el.click`, because
                // `el.click` seems to be broken in PhantomJS
                // http://stackoverflow.com/questions/17468611/triggering-click-event-phantomjs

                var e = doc.createEvent("MouseEvent");
                e.initMouseEvent(
                    "click",
                    true,
                    true,
                    win,
                    null,
                    0,0,0,0,
                    false, false, false, false,
                    0,
                    null
                );
                el.dispatchEvent(e);
            }
            // Set an offset so we can test scrolling
            win.scrollTo(0, 10);

            // Click the link in question
            var link = doc.getElementById(id);
            triggerClick(link);

            setTimeout(function() {
                if (skip()) {
                    ok(true, "Test harness does not work on Android < 4.0. Must be tested manually.");
                    return start();
                }

                // Call ready so we can fire assertions
                ready(win, doc);
            }, 100);
        }, false);

        $("#qunit-fixture").append($iframe);
    };

    var getScrollTop = function(win) {
        return typeof win.scrollY !== "undefined" ? win.scrollY : win.document.documentElement.scrollTop;
    };

    asyncTest("Regular Anchor Tag to Element", function() {
        testSetup('test1', function(win, doc) {
            equal(win.hadHashOnLoad, false);
            
            // Some browsers have a little different idea about how
            // much do you need to do to scroll them in to view.
            var scrollTop = getScrollTop(win);
            ok((scrollTop >= 490) && (scrollTop <= 510), "Expected scroll position to be between [490, 510], got " + scrollTop);

            start();
        });
    });

    asyncTest("Regular Anchor Tag to Top of Page", function() {
        testSetup('test2', function(win, doc) {
            equal(win.hadHashOnLoad, false);
            equal(getScrollTop(win), 0);

            start();
        });
    });

    asyncTest("Anchor Tag with Handler (no Prevent Default)", function() {
        testSetup('test3', function(win, doc) {
            equal(win.hadHashOnLoad, false);
            
            // Some browsers have a little different idea about how
            // much do you need to do to scroll them in to view.
            var scrollTop = getScrollTop(win);
            ok((scrollTop >= 490) && (scrollTop <= 510), "Expected scroll position to be between [490, 510], got " + scrollTop);
            
            ok(win.testFired3, "Click handler was fired.");

            start();
        });
    });

    asyncTest("Anchor Tag with Handler (Prevent Default)", function() {
        testSetup('test4', function(win, doc) {
            equal(win.hadHashOnLoad, false);
            equal(getScrollTop(win), 10);
            ok(win.testFired4, "Click handler was fired.");

            start();
        });
    });

    asyncTest("Anchor Tag with onclick (no Prevent Default)", function() {
        testSetup('test5', function(win, doc) {
            equal(win.hadHashOnLoad, false);
            
            // Some browsers have a little different idea about how
            // much do you need to do to scroll them in to view.
            var scrollTop = getScrollTop(win);
            ok((scrollTop >= 490) && (scrollTop <= 510), "Expected scroll position to be between [490, 510], got " + scrollTop);

            ok(win.testFired5, "Click handler was fired.");

            start();
        });
    });

    asyncTest("Anchor Tag with Handler (return void)", function() {
        testSetup('test6', function(win, doc) {
            equal(win.hadHashOnLoad, false);
            equal(getScrollTop(win), 10);
            ok(win.testFired6, "Click handler was fired.");

            start();
        });
    });

    asyncTest("Anchor Tag with Handler (calls Prevent Default)", function() {
        testSetup('test7', function(win, doc) {
            equal(win.hadHashOnLoad, false);
            equal(getScrollTop(win), 10);
            ok(win.testFired7, "Click handler was fired.");

            start();
        });
    });
    test("Old Firefox UA detection", function() {
        firefoxUAs = {
            "3.6.9": "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.2.9) Gecko/20100915 Gentoo Firefox/3.6.9",
            "25.0": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:25.0) Gecko/20100101 Firefox/25.0",
            "29.0": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:29.0) Gecko/20100101 Firefox/29.0"
        };
        ok(patchAnchorLinks._isOldFirefox(firefoxUAs["3.6.9"]), "firefox 3.6.9 is old");
        ok(patchAnchorLinks._isOldFirefox(firefoxUAs["25.0"]), "firefox 25 is also old");
        ok(!patchAnchorLinks._isOldFirefox(firefoxUAs["29.0"]), "firefox 29 is not old!");
    })
});
