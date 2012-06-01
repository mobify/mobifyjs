// TODO: Add a developer switch to stay on!
(function(window, document, Mobify, undefined) {

var $ = Mobify.$;
var $win = $(window);
var bubbleName = 'mobify-bubble';

function bubble() {
    // TODO: make this configurable timeout, 
    // but giving phones a little time before firing lets page elements
    // settle down a little and helps prevent problems
    if (shouldRun()) setTimeout(showBubble, 750);
}

function shouldRun() {
    // Run if you're iOS and you don't have a cookie.
    var run = (/ip(hone|od)/i.test(navigator.userAgent) && !(new RegExp(bubbleName + '=(.*?)(;|$)')).test(document.cookie)) ? 1 : 0;
    if (run) {
        // Add Hash to tell whether we launched from the BM.
        if (!window.location.hash) window.location.hash += bubbleName;
    }
    // Track whether we showed the bubble.
    document.cookie = bubbleName + '=' + run + '; path=/; expires=' + (new Date(+new Date + 8.64E7 * 365)).toUTCString();
    return !!run;
}

function showBubble() {
    // TODO: Remove move this good stuff into a common class..
    // http://github.com/Modernizr/Modernizr/blob/master/modernizr.js#L236
    var transformProperty = (function() {
        var test = document.createElement('div');
        var testStyle = test.style;
        var prop = 'transform';
        var ucProp = prop.charAt(0).toUpperCase() + prop.substr(1);
        var props = 'Webkit Moz O ms Khtml'.split(' ').join(ucProp + ' ').split(' ');
    
        props.push(prop);
        for (var i in props) {
            if (testStyle[props[i]] !== undefined) {
                return props[i];
            }
        }
    })();
    
    var $bubble = $('#mobify-bubble');
    var isClosed;
    var origin;
    var scrollTimeoutId;

    // Show the bubble once the icon has loaded.
    var icon = new Image();
    icon.onload = loaded;
    icon.src = $('link[rel="apple-touch-icon"]').attr('href');
    
    $('#mobify-bubble-icon').css('background', 'url(' + icon.src + ')');

    function loaded() {
        setup();
        timedScroll();

        $win.bind('scroll.bubble', timedScroll)
        $win.bind('orientationchange.bubble', setup);
        
        $('#mobify-bubble-toggle').bind($.support.events.down, function() {
            close();
            return false;
        });

        setTimeout(close, 15 * 1000);
    }
  
    // Set origin just off the bottom of the screen.
    function setup() {
        origin = Math.ceil(window.scrollY + window.innerHeight);
        $bubble.css('top', origin + 'px');
    }
    
    function timedScroll() {
        if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
        scrollTimeoutId = setTimeout(function() {
            $bubble.addClass('on');
            // ZEPTO: Doesn't support outerHeight :|
            //var y = Math.ceil(window.scrollY + window.innerHeight - ($bubble.outerHeight() || 127) - origin);
            var y = Math.ceil(window.scrollY + window.innerHeight - 120 - origin);
            // ZEPTO: css is set using cssText, not using properties, so we need to spec the full string.
            //$bubble.css(transformProperty, 'translate' + ($.support.transitions3d ? '3d(0,' + y + 'px,0)' : '(0,' + y + 'px)'));
            $bubble.css('-webkit-transform', 'translate' + ($.support.transitions3d ? '3d(0,' + y + 'px,0)' : '(0,' + y + 'px)'));
        }, 0);
    }
  
    function close() {
        if (isClosed) return;
        isClosed = true;

        $win.unbind('.bubble');
        $bubble.unbind();

        // FF: This won't fire... is this a problem?     
        //$bubble.bind('webkitTransitionEnd', function() {
        //    $bubble.removeClass('on closing');
        //});
        $bubble.removeClass('on');
    }
};

Mobify.bubble = bubble;

})(window, document, Mobify);
