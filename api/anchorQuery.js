(function(Mobify, $){
    var anchor = function($root) {
        var rootedQuery = function(selector, context, rootQuery) {
            return ($.fn.init || $.zepto.init).call(this, selector, context || anchored.context(), rootQuery);
        };

        var anchored = $.sub(rootedQuery); 

        anchored.context = function() {
            return $root || '<div>';
        }

        if (!anchored.zepto)  {
            anchored.fn.init = rootedQuery;
            anchored.fn.init.prototype = $.fn;
        }

        return anchored;
    };

    $.sub = $.sub || function(rootedQuery) {
        $.extend(rootedQuery, $);
        rootedQuery.zepto = $.extend({}, $.zepto);
        return rootedQuery;
    };

    $.fn.anchor = function() {
        return anchor(this);
    };    
})(Mobify, Mobify.$);