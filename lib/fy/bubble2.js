/* 
* smartscroll: debounced scroll event for jQuery *
* https://github.com/lukeshumard/smartscroll
* Based on smartresize by @louis_remi: https://github.com/lrbabe/jquery.smartresize.js *
* Copyright 2011 Louis-Remi & Luke Shumard * Licensed under the MIT license. *
*/
(function($) {

    var event = $.event,
        scrollTimeout;

    event.special.smartscroll = {
        setup: function () {
            $(this).bind('scroll', event.special.smartscroll.handler);
        },
        teardown: function () {
            $(this).unbind('scroll', event.special.smartscroll.handler);
        },
        handler: function (event, execAsap) {
            // Save the context
            var context = this,
              args = arguments;

            // set correct event type
            event.type = 'smartscroll';

            if (scrollTimeout) { clearTimeout(scrollTimeout); }
            scrollTimeout = setTimeout(function () {
                $.event.handle.apply(context, args);
            }, execAsap === 'execAsap' ? 0 : 100);
        }
    };

    $.fn.smartscroll = function (fn) {
        return fn ? this.bind('smartscroll', fn) : this.trigger('smartscroll', ['execAsap']);
    };

})(jQuery || Mobify.$);


// JB: This is a handy plugin. Anyway we can manage these depedancies?
// TODO: Move `has` function into mobify core.
// TODO: Is this cancelable?
// BUBBLE!
// TODO: Default bind on closers.
// TODO: hasTransitionEnd
// TODO: unbind
// if shouldLoad(), otherwise check back.
// you provide the shouldload?
// TODO: Only allow one bubble?
(function($, undefined) {
    function bubble($el, options) {        
        var opts = $.extend({}, bubble.defaults, options);
        if (!opts.shouldOpen()) return;
        
        var transformProperty = (function() {
                var test = document.createElement('div');
                var testStyle = test.style;
                var prop = 'transform';
                var ucProp = prop.charAt(0).toUpperCase() + prop.substr(1);
                var props = 'Webkit Moz O ms Khtml'.split(' ').join(ucProp + ' ').split(' ').concat([prop]);
                for (var i in props) if (testStyle[props[i]] !== undefined) return props[i];
            })();


        // Calculate transformations from the origin.
        var origin;
        //
        var height = $el.outerHeight();

        function resetOrigin() {
            origin = Math.ceil(scrollY + innerHeight);
            $el.css('top', origin + 'px');
        }

        // Translate to fully visible above the bottom of the screen.
        function move() {
            var y = Math.ceil(scrollY + innerHeight - height - origin);
            $el.css('-webkit-transform', 'translate3d(0,' + y + 'px,0)');
        }

        function ready() {
            if (opts.timeout) setTimeout(hide, opts.timeout);

            resetOrigin();
            move();

            $(window)
                .bind('orientationchange.bubble', resetOrigin)
                .bind('smartscroll.bubble', move);

            // You're ready to go kid.
            $el.addClass(opts.on);
        }

        function hide() {
            $el
                .addClass(opts.closing)
                .bind('webkitTransitionEnd', function() {
                    $el.removeClass(opts.on);
                });
        }            
        
        if (opts.shouldLoad()) ready();
    }

    bubble.defaults = {
        shouldOpen: function() {
            return true;   
        },
        shouldLoad: function() {
            return true;
        },
        timeout: 10000,
        on: 'x-on',
        closing: 'x-closing'
        // closeSelector
    };

    $.fn.bubble = function(opts) {
        var $el = this.eq(0);
        if ($el.length) bubble($el, opts);
        return this;
    }

})(Mobify.$);