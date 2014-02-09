require(["mobifyjs/utils", "mobifyjs/resizeImages", "mobifyjs/jazzcat", "mobifyjs/cssOptimize"], function(Utils, ResizeImages, Jazzcat, CssOptimize) {
    var Mobify = window.Mobify = window.Mobify || {};

    // Expose APIs we want to use from Mobify.js
    Mobify.Utils = Utils;
    Mobify.ResizeImages = ResizeImages;
    Mobify.Jazzcat = Jazzcat;
    Mobify.CssOptimize = CssOptimize;

    // Backwards compatible fixes
    var $ = Mobify && Mobify.$;
    if (!$) {
        return;
    }

    // Jazzcat:
    Mobify.combo = Jazzcat;
    $.fn.combineScripts = function(opts) {
        return Mobify.Jazzcat.optimizeScripts.call(window, this, opts)
    };
    Mobify.Jazzcat.defaults.projectName = (Mobify && Mobify.config && Mobify.config.projectName) || ''

    // expose defaults for testing
    $.fn.combineScripts.defaults = Mobify.Jazzcat.defaults;

    Mobify.cssURL = function(obj) {
        return '//jazzcat.mobify.com/css/' + encodeURIComponent(JSON.stringify(obj));
    }

    // ResizeImages
    $.fn.resizeImages = function(opts) {
        var imgs = this.find('img').toArray();
        return Mobify.ResizeImages.resize.call(window, imgs, opts)
    };
    Mobify.ResizeImages.defaults.projectName = Mobify.config.projectName || ''
    $.fn.resizeImages.defaults = Mobify.ResizeImages.defaults;

    Mobify.getImageURL = function(url, options) {
        // getImageURL behaves differently in 2.0 for how
        // options get populated.
        var opts = ResizeImages.processOptions();
        if (options) {
            Utils.extend(opts, options);
        }
        return Mobify.ResizeImages.getImageURL(url, opts);
    }

});
// relPath, forceSync
