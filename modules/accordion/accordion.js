var Mobify = window.Mobify = window.Mobify || {}; 
Mobify.$ = Mobify.$ || window.Zepto || window.jQuery;
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

        // Not Supported
        return;
    };

    /**
        Returns prefix event for current browser.
        @param {String} Event Name
        @return {String} Detected Event Name
    */
    exports.getEvent = function(name) {
        var prefixes = ['webkit', 'moz', 'O', 'ms', ''];

        for (var i = 0; i < prefixes.length; ++i) {
            if (('on' + prefixes[i] + name.toLowerCase()) in window) {
                return prefixes[i] + name;
            }
        }

        // Not Supported
        return;
    };

    $.extend(exports.events, {
        'transitionend': exports.getEvent("TransitionEnd")
    });

    return exports;

})(Mobify.$);


Mobify.UI.Accordion = (function($, Utils) {
   
    var has = $.support;

    // Constructor
    var Accordion = function(element) {
        this.element = element;
        this.$element = $(element);
        this.dragRadius = 10;
        this.bind();
    };

    Accordion.prototype.bind = function() {
        var $element = this.$element
            , transitioning = false
            , dragging = false
            , canceled = false
            , xy
            , dxy
            , dragRadius = this.dragRadius;

        function endTransition(e){
            // recalculate proper height
            transitioning = false;
            var height = 0;
            $('.item').each(function(index) {
                var $item = $(this);
                height += $item.height();
            });
            $element.css('min-height', height + 'px'); 
        };

        function close($item) {
            var $content = $item.find('.content');
            contentHeight = $content.height();
            $item.toggleClass('active');
            $content.removeAttr('style')
        };
        
        function open($item) {
            var $content = $item.find('.content');
            $item.toggleClass('active');
            var contentHeight = $content.children().outerHeight();
            $element.css('min-height', $element.height() + contentHeight + 'px');
            $content.css('max-height', contentHeight +'px');
        };

        function down(e) {
            xy = Utils.getCursorPosition(e);
        };

        function move(e) {
            dxy = Utils.getCursorPosition(e);
        };

        function up(e) {
            // if there is dragging, do not close/open accordion
            if (dxy) {
                dx = xy.x - dxy.x;
                dy = xy.y - dxy.y;
                dxy = undefined;
                if ((dx*dx) + (dy*dy) > dragRadius*dragRadius) return;
            }

            // prevent open/close when an item is transitioning
            if (transitioning) return;
            transitioning = true;

            // toggle open/close on item tapped
            var $item = $(this).parent();
            if ($item.hasClass('active')) {
                close($item);
            }
            else {
                open($item);
            }
        };

        function click(e) {
            e.preventDefault();
        };


        // Open items that are hash linked
        var hash = location.hash;
        var $hashitem = $element.find('.header a[href="'+hash+'"]');
  
        if ($hashitem.length) {
            open($hashitem.parent());
        }

        // bind events
        $element.find('.header')
            .on(Utils.events.down, down)
            .on(Utils.events.move, move)
            .on(Utils.events.up, up)
            .on('click', click);
        $element.on(Utils.events.transitionend, endTransition);
        
    };
                 
    Accordion.prototype.unbind = function() {
        this.$element.off();      
    }
                 
    Accordion.prototype.destroy = function() {
        this.unbind();
        this.$element.remove();
        this.$element = null;
    }
    
    return Accordion;
    
})(Mobify.$, Mobify.UI.Utils);
    
(function($) {
    $.fn.accordion = function(action) {
        this.each(function () {
            var $this = $(this)
              , accordion = $this._accordion

            if (!accordion) {
                accordion = new Mobify.UI.Accordion(this);
            }   

            if (action) {
                accordion[action]();

                if (action === 'destroy') {
                    accordion = null;
                }   
            }   

            $this._accordion = accordion;
        })  

        return this;
    };
})(Mobify.$);
