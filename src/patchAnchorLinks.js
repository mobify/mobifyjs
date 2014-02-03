// Fixes anchor links (on FF)


var Utils = require('./utils');

var exports = {};

var isFirefox = function(ua) {
    ua = window.navigator.userAgent;

    return /firefox|fennec/i.test(ua)
};

var _patchAnchorLinks = function(doc) {
    // Anchor links in FF, after we do `document.open` cause a page
    // navigation (a refresh) instead of just scrolling the
    // element in to view.
    //
    // So, we prevent the default action on the element, and
    // then manually scroll it in to view (unless some else already
    // called prevent default).

    var body = doc.body;

    if (!(body && body.addEventListener)) {
        // Body is not there or we can't bind as expected.
        return;
    }

    var _handler = function(e) {
        // Handler for all clicks on the page, but only triggers
        // on proper anchor links.

        var target = e.target;

        var matches = function(el) {
            return (el.nodeName == "A") && (/^#/.test(el.getAttribute('href')));
        }

        if (!matches(target)) {
            return;
        }
        
        // Newer browsers support `e.defaultPrevented`. FF 4.0 supports `e.getPreventDefault()`
        var defaultPrevented = (typeof e.defaultPrevented !== "undefined") ?
            e.defaultPrevented :
            e.getPreventDefault && e.getPreventDefault();

        if (!defaultPrevented) {
            // Prevent the default action, which would cause a
            // page refresh.
            e.preventDefault();

            // But pretend that we didn't call it.
            e.defaultPrevented = false;

            // We have to wait and see if anyone else calls
            // `preventDefault`. If they do, we don't scroll.
            var scroll = true;

            // Override the `preventDefault` to stop  us from scrolling.
            e.preventDefault = function() {
                e.defaultPrevented = true;
                scroll = false;
            }

            // If no other events call `preventDefault` we manually
            // scroll to the element in question.
            setTimeout(function() {
                if (scroll) {
                    _scrollToAnchor(target.getAttribute('href'));
                }
            }, 50);
        }   
    };


    var _scrollToAnchor = function(anchor) {
        // Scrolls to the element, if any, that matches
        // the given anchor link (eg, "#foo").

        var anchorRe = /^#([^\s]*)/;
        var match = anchor.match(anchorRe);
        var target;
        
        // Find the target, if any
        if (match && match[1] === "") {
            target = doc.body;
        } else if (match && match[1]) {
            var target = doc.getElementById(match[1]);
        }

        // Scroll to it, if it exists
        if (target) {
            target.scrollIntoView && target.scrollIntoView();
        }
    };

    // We have to get the event through bubbling, otherwise
    // events cancelled by the return value of an onclick
    // handler are not correctly handled.
    body.addEventListener('click', _handler, false);
};

var patchAnchorLinks = function() {
    if (!isFirefox()) {
        return
    }

    Utils.waitForReady(document, _patchAnchorLinks);
}

module.exports = patchAnchorLinks;