define(["./mobifyjs"], function() {
    var $ = window.$ || window.Zepto || Mobify.$;
    if (!$) return;

    if ($.noConflict) {
        Mobify.$ = $.noConflict(true);
        delete window.jQuery;
    } else if ($.zepto) {
        Mobify.$ = $;
        Mobify.$.support = Mobify.$.support || {};
        if (window.Zepto === window.$) delete window.$;
        delete window.Zepto;
    }
    return $;
});