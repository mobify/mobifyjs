require(["mobifyjs/utils", "mobifyjs/resizeImages", "mobifyjs/jazzcat"],
         function(Utils, ResizeImages, Jazzcat) {
    var Mobify = window.Mobify;
    
    // Backwards compatible fixes
    var $ = Mobify && Mobify.$;
    if (!($ && $.fn)) {
        return;
    }

    // Expose API Surface
    Mobify.combo = {};
    Mobify.combo.httpCache = Jazzcat.httpCache;
    Mobify.combo.load = Jazzcat.load;
    Mobify.combo.exec = Jazzcat.exec;
    Mobify.combo.getURL = Jazzcat.getURL;
    
    $.fn.combineScripts = function(opts) {
        if (!this) {
            return $([]);
        }
        opts = opts || {};
        this.remove();
        opts.inlineLoader = false;
        return $(Jazzcat.optimizeScripts.call(window, this, opts));
    };
    
    Jazzcat.defaults.projectName = (
        (Mobify && Mobify.config && Mobify.config.projectName) ||
        ''
    );
    Jazzcat.defaults.execCallback = 'Mobify.combo.exec';
    Jazzcat.defaults.loadCallback = 'Mobify.combo.load';
    Jazzcat.defaults.cacheLoadCallback = 'Mobify.combo.httpCache.load';

    // expose defaults for testing
    $.fn.combineScripts.defaults = Jazzcat.defaults;

    Mobify.cssURL = function(obj) {
        return '//jazzcat.mobify.com/css/' + encodeURIComponent(JSON.stringify(obj));
    };

    // ResizeImages
    $.fn.resizeImages = function(opts) {
        var imgs = this.filter('img').add(this.find('img')).toArray();
        return $(ResizeImages.resize.call(window, imgs, opts));
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

}, undefined, true);
// relPath, forceSync
