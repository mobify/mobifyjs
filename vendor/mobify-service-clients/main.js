require(["mobifyjs/utils", "mobifyjs/resizeImages", "mobifyjs/jazzcat"],
         function(Utils, ResizeImages, Jazzcat) {
    var Mobify = window.Mobify;
    
    // Backwards compatible fixes
    var $ = Mobify && Mobify.$;
    if (!($ && $.fn)) {
        return;
    }

    // Jazzcat:
    Mobify.combo = {};
    Mobify.combo.httpCache = Jazzcat.httpCache;
    Mobify.combo.load = Jazzcat.load;
    Mobify.combo.exec = Jazzcat.load;
    Mobify.combo = Jazzcat;
    
    $.fn.combineScripts = function($els, opts) {
        return Mobify.Jazzcat.optimizeScripts.call(window, this, opts);
    };
    
    Jazzcat.defaults.projectName = (
        (Mobify && Mobify.config && Mobify.config.projectName) ||
        ''
    );

    // expose defaults for testing
    $.fn.combineScripts.defaults = Jazzcat.defaults;

    Mobify.cssURL = function(obj) {
        return '//jazzcat.mobify.com/css/' + encodeURIComponent(JSON.stringify(obj));
    };

    // ResizeImages
    $.fn.resizeImages = function(opts) {
        var imgs = this.find('img').toArray();
        return ResizeImages.resize.call(window, imgs, opts);
    };
    
    ResizeImages.defaults.projectName = Mobify.config.projectName || '';
    $.fn.resizeImages.defaults = ResizeImages.defaults;

    Mobify.getImageURL = function(url, options) {
        // getImageURL behaves differently in 2.0 for how
        // options get populated.
        var opts = ResizeImages.processOptions();
        if (options) {
            Utils.extend(opts, options);
        }
        return ResizeImages.getImageURL(url, opts);
    };

});
