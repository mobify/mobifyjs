// TODO: orientationchange should fire on every element that binds to it (like ajaxevents)
// TODO: Does unbind remove the offset?
// TODO: How to handle multiple sliders?
// TODO: Who create the dots... me or you?
// TODO: Should lazylookahead default to 0
// TODO: Add documentation about the slider.
// TODO: Add -correct- detection of browser prefixes.
// TODO: Calculate a natural animation time for focusing.
// TODO: Allow reseting? support changes to DOM.
// TODO: Is there a method to remove me?
(function(window, document, $, undefined) {
    $.extend($.support, {
        touch: 'ontouchend' in document,
        //transitions: 'WebKitTransitionEvent' in window,
        transitions3d: !! (window.WebKitCSSMatrix && 'm11' in new WebKitCSSMatrix())
    });

    var abs = Math.abs;
    var has = $.support;

    // TODO: These are useful and should be factored out!
    var getXY = (has.touch)
         ? function(e) {e = e.originalEvent || e; return {x: e.touches[0].clientX, y: e.touches[0].clientY}}
         : function(e) {return {x: e.clientX, y: e.clientY}};

    var events = (has.touch)
        ? {down: 'touchstart', move: 'touchmove', up: 'touchend'}
        : {down: 'mousedown', move: 'mousemove', up: 'mouseup'};
    
    $.support.events = events;

    var translateOpen = 'translate' + (has.transitions3d ? '3d(' : '(');
    var translateClose = has.transitions3d ? 'px,0,0)' : 'px,0)';
    var prefixes = ['Webkit', 'Moz', 'O', 'ms', ''];
    var testStyle = document.createElement('div').style;
    var getProperty = function(name) {
        for (var i = 0; i < prefixes.length; ++i) {
            if (testStyle[prefixes[i] + name] !== undefined) {
                return prefixes[i] + name;
            }
        }
    };

    var transformProperty = getProperty("Transform");
    var durationProperty = getProperty("TransitionDuration");
    var hasTransform = !!transformProperty;

    // Slide should only be bound once. How to ... rebind?
    function slide(el, options) {
        var $el = $(el);
        if ($el.data('slide')) return;
        $el.data('slide', true);

        var opts = $.extend({}, slide.defaults, options);

        var style = $el[0].style;
        var $nodes = $el.children();
        var length = $nodes.length;

        var index = 0;
        var transitionOffset = 0;

        var transition = hasTransform 
            ? function(v) { el.style[transformProperty] = translateOpen + (v || transitionOffset) + translateClose; } 
            : function(v) { style.left = (v || transitionOffset) + 'px' };

        // You can pass me `null` to recenter things.
        function move(direction, force) {
            var newIndex = index + (direction * -1);
            moveTo(newIndex, force);
        }

        transition();

        // Set `force` to recalculate offsets.
        function moveTo(newIndex, force) {
            if (newIndex < 0) newIndex = 0;
            if (newIndex >= length) newIndex = length - 1;
            if (force || newIndex != index) {
                if (!force) {
                    $el.trigger('indexchange', [newIndex, index]);

                    if (opts.focus) {
                        var offset = $(opts.focus).offset();
                        if (offset) $('body').animate({scrollTop: offset.top}, 250);                        
                    }

                    var $ahead = $nodes.slice(0, newIndex + 1 + opts.lazyLookahead).find('img[lazysrc]');
                    $ahead.each(function(i, el) {
                        this.setAttribute('src', this.getAttribute('lazysrc'));
                        this.removeAttribute('lazysrc');
                    });
                }
                
                index = newIndex;

                var $cur = $nodes.eq(index);
                var $start = $nodes.eq(0);

                var curLeft = $cur.offset().left;
                var startLeft = $start.offset().left;

                var curWidth = $cur.width();
                var startWidth = $start.width();

                // ZEPTO: May return NaN here.
                var initialOffset = parseInt($start.parent().css('marginLeft')) || 0;
                
                transitionOffset = -(curLeft - startLeft - (curWidth - startWidth) * ( initialOffset / startWidth));
                
            }

            style[durationProperty] = opts.duration;
            transition();
        }

        var dragging = false;
        var canceled = false;
        var xy, dx, dy, dragThresholdMet;

        function start(e) {
            if (!has.touch) e.preventDefault();

            dragging = true;
            canceled = false;
            xy = getXY(e);
            dx = 0;
            dy = 0;
            dragThresholdMet = false;

            style[durationProperty] = "0s";
        }

        function drag(e) {
            
            if (!dragging || canceled) return;
                
            var cXY = getXY(e);
            dx = xy.x - cXY.x;
            dy = xy.y - cXY.y;

            if (dragThresholdMet || abs(dx) > abs(dy) && (abs(dx) > opts.minDragDelta)) {
                dragThresholdMet = true;

                e.preventDefault();

                // Slow movement when out of bounds.
                if ((index == 0 && dx < 0) || ((index == length - 1) && dx > 0)) dx *= 0.4;

                transition(transitionOffset - dx);
            
            } else if ((abs(dy) > abs(dx)) && (abs(dy) > opts.minDragDelta)) {
                canceled = true;
            }
        }

        // Calculate # of steps to slide by checking x delta.
        function end(e) {
            dragging = false;

            var adx = abs(dx);
            var steps = 0;
            if (adx > abs(dy) && adx > opts.minMoveDelta) {
                steps = adx > $nodes.eq(index).width() ? 2 : 1;
                steps *= dx > 0 ? -1 : 1;
            }
            move(steps);
        }

        function click(e) {
            if (dragThresholdMet) e.preventDefault();
        }

        function mouseout() {
            if (dragging) end();
        }

        // Reset transition offset if item width changes on rotation.
        function orientationchange() {
            setTimeout(function() {
                move(0, true);
            }, 1);
        }

        $(window).bind('orientationchange.slide', orientationchange);

        $el
            .bind(events.down + '.slide', start)
            .bind(events.move + '.slide', drag)
            .bind(events.up + '.slide', end)
            .bind('click.slide', click)
            .bind('slidemove.slide', function(e, direction) { 
                move(direction); 
            })
            .bind('indexchange.slide', function(e, newIndex, oldIndex) {
                $(opts.dots).children()
                    .removeClass(opts.dotsClass)
                    .eq(newIndex).addClass(opts.dotsClass);
            })
            .trigger('indexchange', [index, index]);

        if (!has.touch) $el.bind('mouseout.slide', mouseout);
        
        if (length <= opts.maxDots) {
            $(opts.dots)
                .addClass('on')
                // BB: Doesn't alway use TouchEvents so double bind.
                // iOS: Generated MouseEvents can only be prevented on touchstart.
                .children().bind('touchstart.slide mouseup.slide', function(e) {
                    if (e.type == 'touchstart') e.preventDefault();
                    moveTo($(this).index());
                });
        }
    }

    function unslide(el, options) {
        var opts = $.extend({}, slide.defaults, options);
        var $el = $(el);
        $el.unbind('.slide').data('slide', false);
        $(window).unbind('.slide');
        $(opts.dots).unbind('.slide');
    }

    slide.defaults = {
        minDragDelta: 10,
        minMoveDelta: 20,
        dots: '.x-slide-dots',
        dotsClass: 'x-current',
        maxDots: 12,
        duration: '0.5s',
        lazyLookahead: 1
    };

    $.fn.slide = function(options) {
        return this.each(function() {
            slide(this, options);
        });   
    }

    $.fn.unslide = function(options) {
        return this.each(function() {
            unslide(this, options);
        });
    }
    
    // TODO: Can we just use $.ready?
    document.addEventListener('DOMContentLoaded', function DOMContentLoaded() {
        document.removeEventListener('DOMContentLoaded', DOMContentLoaded, false);
        $('.x-slide-items').slide();
    }, false);

})(window, document, Mobify.$);