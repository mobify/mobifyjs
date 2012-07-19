var Mobify = window.Mobify = window.Mobify || {};
$ = Mobify.$ = $ || Mobify.$ || window.Zepto || jQuery;
Mobify.UI = Mobify.UI || {};



(function($, document) {
    $.support = $.support || {};

    $.extend($.support, {
        'touch': 'ontouchend' in document
    });

})($, document);



/**
    @module Holds common functions relating to UI.
*/
Mobify.UI.Utils = (function($) {
    var exports = {}
        , has = $.support;

    /**
        Events (either touch or mouse)
    */
    exports.events = (has.touch)
        ? {down: 'touchstart', move: 'touchmove', up: 'touchend'}
        : {down: 'mousedown', move: 'mousemove', up: 'mouseup'};

    /**
        Returns the position of a mouse or touch event in (x, y)
        @function
        @param {Event} touch or mouse event
        @returns {Object} X and Y coordinates
    */
    exports.getCursorPosition = (has.touch)
        ? function(e) {e = e.originalEvent || e; return {x: e.touches[0].clientX, y: e.touches[0].clientY}}
        : function(e) {return {x: e.clientX, y: e.clientY}};


    /**
        Returns prefix property for current browser.
        @param {String} CSS Property Name
        @return {String} Detected CSS Property Name
    */
    exports.getProperty = function(name) {
        var prefixes = ['Webkit', 'Moz', 'O', 'ms', '']
          , testStyle = document.createElement('div').style;
        
        for (var i = 0; i < prefixes.length; ++i) {
            if (testStyle[prefixes[i] + name] !== undefined) {
                return prefixes[i] + name;
            }
        }
    };

    $.extend(has, {
        'transform': !! (exports.getProperty("Transform"))
        , 'transform3d': !! (window.WebKitCSSMatrix && 'm11' in new WebKitCSSMatrix()) 
    });

    // translateX(element, delta)
    // Moves the element by delta (px)
    var transformProperty = exports.getProperty("Transform");
    if (has.transform3d) {
        exports.translateX = function(element, delta) {
             element.style[transformProperty] = "translate3d(" + delta  + "px,0,0)";
        };
    } else if (has.transform) {
        exports.translateX = function(element, delta) {
             element.style[transformProperty] = "translate(" + delta  + "px,0)";
        };
    } else {
        exports.translateX = function(element, delta) {
            element.style['left'] = delta + "px";
        };
    }

    // setTransitions
    var transitionProperty = exports.getProperty("Transition");
    var durationProperty = exports.getProperty("TransitionDuration");
    exports.setTransitions = function(element, duration) {
        if (duration <= 0) {
            element.style[durationProperty] = "0s";
        } else {
            element.style[durationProperty] = duration;
        }
    }

    return exports;

})($);

Mobify.UI.Carousel = (function($, Utils) {
    var defaults = {
        duration: '0.5s'
        , dragRadius: 10
        , moveRadius: 20
    };

    var has = $.support;

    // Constructor
    var Carousel = function(element, options) {
        this.element = element;
        this.$element = $(element);
        this.$inner = this.$element.find('.carousel-inner');
        this.$items = this.$inner.find('.item');

        this.options = $.extend({}, defaults, options);
        
        this._index = 0;
        this._offset = 0;
        this._length = this.$items.length;
        
        
        this.$start = this.$items.eq(0);
        this.$current = this.$items.eq(this._index);

        this.animating = false;
        this._enableAnimation();

        this.dragging = false;
        this.bind();


    };

    // Expose Defaults
    Carousel.defaults = defaults;


    Carousel.prototype._enableAnimation = function() {
        if (this.animating) {
            return;
        }

        Utils.setTransitions(this.$inner[0], this.options['duration']);
        this.animating = true;
    }

    Carousel.prototype._disableAnimation = function() {
        if (!this.animating) {
            return;
        }
        
        Utils.setTransitions(this.$inner[0], '0');
        this.animating = false;
    }

    Carousel.prototype.bind = function() {
        var abs = Math.abs
            , dragging = false
            , canceled = false
            , dragRadius = this.options['dragRadius']
            , xy
            , dx
            , dy
            , dragThresholdMet
            , self = this
            , $element = this.$element
            , $inner = this.$inner
            , opts = this.options;

        function start(e) {
            if (!has.touch) e.preventDefault();

            dragging = true;
            canceled = false;

            xy = Utils.getCursorPosition(e);
            dx = 0;
            dy = 0;
            dragThresholdMet = false;

            // Disable smooth transitions
            self._disableAnimation();
        }

        function drag(e) {
            if (!dragging || canceled) return;

            var newXY = Utils.getCursorPosition(e);
            dx = xy.x - newXY.x;
            dy = xy.y - newXY.y;

            if (dragThresholdMet || abs(dx) > abs(dy) && (abs(dx) > dragRadius)) {
                dragThresholdMet = true;
                e.preventDefault();
                
                Utils.translateX($inner[0], self._offset - dx);
            } else if ((abs(dy) > abs(dx)) && (abs(dy) > dragRadius)) {
                canceled = true;
            }
        }

        function end(e) {

            if (!dragging) {
                return;
            }
            dragging = false;
            self._enableAnimation();
            if (!canceled && abs(dx) > opts.moveRadius) {
                if (dx > 0) {
                    self.next();
                } else {
                    self.prev();
                }
            }

        }

        function click(e) {
            if (dragThresholdMet) e.preventDefault();
        }

        $inner
            .on(Utils.events.down + ".carousel", start)
            .on(Utils.events.move + ".carousel", drag)
            .on(Utils.events.up + ".carousel", end)
            .on("click.carousel", click)
            .on("mouseout.carousel", end);

        $element.find('[data-slide]').each(function(){
            $(this).click(function(){
                self[$(this).attr('data-slide')]();
            });
            //TODO: Add logic here for event bindings on dots
        })

    };

    Carousel.prototype.unbind = function() {
        this.$inner.off();
    }

    Carousel.prototype.destroy = function() {
        this.$element.trigger('destroy');
        this.$element.remove();
    }

    Carousel.prototype.move = function(newIndex, opts) {
        var $element = this.$element
            , $inner = this.$inner
            , $items = this.$items
            , $start = this.$start
            , $current = this.$current
            , length = this._length
            , index = this._index;
                
        opts = opts || {};

        // Bound Values between (0, length);
        if (newIndex < 0) {
            newIndex = 0;
        } else if (newIndex >= this._length) {
            newIndex = length - 1;
        }
        
        // Bail out early if no move is necessary.
        if (newIndex == this._index) {
            //return; // Return Type?
        }

        // Trigger beforeSlide event
        $element.trigger('beforeSlide', [index, newIndex]);

        this.$current = $current = $items.eq(newIndex);

        var currentOffset = $current.offset().left
            , startOffset = $start.offset().left; 

        var transitionOffset = -(currentOffset - startOffset);

        Utils.translateX($inner[0], transitionOffset);


        this._offset = transitionOffset;
        this._index = newIndex;
        // Trigger afterSlide event
        $element.trigger('afterSlide', [index, newIndex]);
    };

    Carousel.prototype.next = function() {
        this.move(this._index + 1);
    };
    
    Carousel.prototype.prev = function() {
        this.move(this._index - 1);
    };

    return Carousel;

})($, Mobify.UI.Utils);

/**
    jQuery interface to set up a carousel


    @param {String} [action] Action to perform. When no action is passed, the carousel is simply initialized.
    @param {Object} [options] Options passed to the action.
*/
$.fn.carousel = function (action, options) {
    this.each(function () {
        var $this = $(this)
          , carousel = $this._carousel
          , initOptions = $.extend({}, $.fn.carousel.defaults);


        // Handle different calling conventions
        if (typeof action == 'object') {
            initOptions = action;
            options = null;
            action = null;
        } 
        
        if (!carousel) {
            carousel = new Mobify.UI.Carousel(this, initOptions);
        }

        if (action) {
            carousel[action](options);

            if (action === 'destroy') {
                carousel = null;
            }
        }
        
        $this._carousel = carousel;
    })

    return this;
};

$.fn.carousel.defaults = {
};
