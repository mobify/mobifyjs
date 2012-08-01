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

    // http://stackoverflow.com/questions/5023514/how-do-i-normalize-css3-transition-functions-across-browsers
    function whichTransitionEvent(){
        // hack for ios 3.1.* because of poor transition support.
        if (/iPhone\ OS\ 3_1/.test(navigator.userAgent)) {
            return undefined;
        }

        var el = document.createElement('fakeelement');
        var transitions = {
            'transition':'transitionEnd',
            'OTransition':'oTransitionEnd',
            'MSTransition':'msTransitionEnd',
            'MozTransition':'transitionend',
            'WebkitTransition':'webkitTransitionEnd'
        }

        var t;
        for(t in transitions){
            if( el.style[t] !== undefined ){
                return transitions[t];
            }
        }
        return;
    };

    $.extend(exports.events, {
        'transitionend': whichTransitionEvent()
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
            , xy
            , dxy
            , dragRadius = this.dragRadius;

        function endTransition(){
            // recalculate proper height
            var height = 0;
            var $item = $(this).parent();
            if ($item.hasClass('m-closed')) $(this).parent().removeClass('m-active');
            $('.m-item', $element).each(function(index) {
                var $item = $(this);
                height += $item.height();
            });
            $element.css('min-height', height + 'px'); 
        };

        function close($item) {
            $item.removeClass('m-opened');
            $item.addClass('m-closed')
            var $content = $item.find('.content');
            if(!Utils.events.transitionend) $item.toggleClass('m-active');
            $content.css('max-height', 0)
        };
        
        function open($item) {
            var $content = $item.find('.content');
            $item.toggleClass('m-active');
            $item.removeClass('m-closed');
            $item.addClass('m-opened')

            var contentChildren = $content.children();
            // determine which height function to use (outerHeight not supported by zepto)
            var contentHeight = ('outerHeight' in contentChildren) ? contentChildren['outerHeight']() : contentChildren['height']();
            $content.css('max-height', contentHeight * 1.5 +'px'); 

            // if transitions are supported, minimize browser reflow
            if (Utils.events.transitionend) {
                $element.css('min-height', $element.height() + contentHeight + 'px');
            }
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

            // toggle open/close on item tapped
            var $item = $(this).parent();
            if ($item.hasClass('m-active')) {
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

        if (Utils.events.transitionend) {
            $element.find('.content').on(Utils.events.transitionend, endTransition);
        }
        
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
