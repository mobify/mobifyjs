// TAP EVENT
// "Fast Click" implementation for Touch enabled browsers.
// On WebKit based Touch devices, TouchEvents are fired ~300ms faster than click events.
// We'd like to to use the 'fastest' event possible on any device but implementation differents
// mean it is not possible to choose one or the other.
// So we must bind to both touch and click. If touch fires, then we shouldn't click.

// Other approaches:
// http://code.google.com/mobile/articles/fast_buttons.html
// https://github.com/jquery/jquery-mobile/blob/master/js/jquery.mobile.event.js
// https://github.com/jquery/jquery-mobile/blob/master/js/jquery.mobile.support.js
// http://smustalks.appspot.com/touch-11/#13

// Custom Events:
// http://brandonaaron.net/blog/2010/02/25/special-events-the-changes-in-1-4-2

(function($) {

var hasTouch = 'ontouchend' in document;

$.event.special.tap = tap = {
    // Amount of moving before it isn't a tap.
    threshold: 10,
    
    // Time to ignore click after touchend.
    handleDelay: 750,

    setup: function() {
        var self = this;
        var $self = $(self);
        var handled, outsideThreshold, handleInterval, startX, startY;

        $self.bind('click.tap', function(e) {
            if (!handled && !outsideThreshold) tap.handler.apply(this, arguments);
        });

        if (!hasTouch) return;

        $self.bind('touchstart.tap', function(e) {
            outsideThreshold = false;
            var touch = e.originalEvent.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        });

        $self.bind('touchmove.tap', function(e) {
            var touch = e.originalEvent.touches[0];
            var deltaX = Math.abs(touch.clientX - startX);
            var deltaY = Math.abs(touch.clientY - startY);
            var maxDelta = Math.max(deltaX, deltaY);
            if (maxDelta > tap.threshold) outsideThreshold = true;
        });
        
        $self.bind('touchend.tap', function(e) {
            if (!outsideThreshold) {
                handled = true;
                tap.handler.apply(self, arguments);
            }
            clearInterval(handleInterval);
            handleInterval = setTimeout(function() {
                handled = false;
            }, tap.handleDelay);
        });
    },

    teardown: function() {
        $(this).unbind('.tap');
    },
      
    handler: function(e) {
        e.type = 'tap';
        $.event.handle.apply(this, arguments);
    }
};

})(jQuery);