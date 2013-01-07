(function(window, $) {

// Android `orientation` support is broken.
var supportsOrientation = $.support.orientation
    = 'orientation' in window && 'onorientationchange' in window
        && !/android/i.test(navigator.userAgent)

    // Returns 'landscape' or 'portrait' based on the current orientation.
  , getOrientation = function() {
        var docEl = document.documentElement;
        return !!(supportsOrientation
            // 0 in portrait, 1 in landscape
            ? orientation % 180 
            // false in portrait, true in landscape
            : docEl.clientWidth > docEl.clientHeight)
        ? 'landscape'
        : 'portrait';
    }

    // Some Android browsers (HTC Sensation) don't update widths immediately,
    // so wait to trigger the event.
  , prevWidth
  , timeout
  , ersatzOrientation = function() {
        clearTimeout(timeout);
        var width = document.documentElement.clientWidth;
        if (width == prevWidth) {
            return timeout = setTimeout(ersatzOrientation, 250);
        }
        prevWidth = width;
        $(window).trigger('orientationchange');
        dispatchListeners();
    }

  , lastOrientation = getOrientation()
  , listeners = []
  , dispatchListeners = function() {
        var orientation = getOrientation(),
            prev = lastOrientation;

        if (orientation != lastOrientation) {
            lastOrientation = orientation;

            // We have this strange order and an extra variable
            // to ensure that exception in a listener would not leave
            // lastOrientation not updated
            for (var i = 0, l = listeners.length; i < l; ++i) {
                listeners[i](orientation, prev);
            }
        }
    }

  , evName = supportsOrientation ? "orientationchange" : "resize"
  , handler = supportsOrientation ? dispatchListeners : ersatzOrientation
  , ensureOrientationHandler = function() {
        $(window).unbind(evName, handler).bind(evName, handler);
    }

Mobify.orientation = function(fn) {
    if (!fn) return getOrientation();
    ensureOrientationHandler();
    listeners.push(fn);
}  

})(this, Mobify.$);