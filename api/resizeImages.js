/**
 * Mobify.js API to the Mobify Image Resizing Service.
 */
(function(window, Mobify, Math) {

var $ = Mobify.$

  , absolutify = document.createElement('a')

    // A regex for detecting http(s) URLs.
  , httpRe = /^https?/

    /**
     * Returns a URL suitable for use with the 'ir' service.
     */
  , getImageURL = Mobify.getImageURL = function(url, options) {
        options = options || {}

        var bits = [defaults.host];

        if (defaults.projectName) {
            bits.push("project-" + defaults.projectName);
        }

        if (options.cacheHours) {
            bits.push('c' + options.cacheHours);
        }

        if (options.format) {
            bits.push(options.format + (options.quality || ''));
        }

        if (options.maxWidth) {
            bits.push(options.maxWidth);

            if (options.maxHeight) {
                bits.push(options.maxHeight);
            }
        }

        bits.push(url);
        return bits.join('/');
    }

    /**
     * Searches the collection for image elements and modifies them to use
     * the Image Resize service. Pass `options` to modify how the images are
     * resized. Returns the collection of images that were modified.
     */
  , resizeImages = $.fn.resizeImages = function(options) {
        var opts = $.extend({}, defaults, typeof options == 'object' && options)
          , dpr = window.devicePixelRatio
          , $imgs = this.filter(opts.selector).add(this.find(opts.selector))
          , attr;

        if (typeof options == 'number') {
            opts.maxWidth = Math.floor(options);
        }

        if (dpr) {
            if (opts.maxWidth) {
                opts.maxWidth = Math.ceil(opts.maxWidth * dpr);
            }

            if (opts.maxHeight) {
                opts.maxHeight = Math.ceil(opts.maxHeight * dpr);
            }
        }

        return $imgs.filter(function() {
            if (attr = this.getAttribute(opts.attribute)) {
                absolutify.href = attr;
                var url = absolutify.href;
                if (httpRe.test(url)) {
                    this.setAttribute('x-src', getImageURL(url, opts));
                    return true
                }
            }
        });
    }

  , defaults = resizeImages.defaults = {
        host: '//ir0.mobify.com'
      , selector: 'img[x-src]'
      , attribute: 'x-src'
      , projectName: Mobify.config.projectName || ''
    }

})(this, Mobify, Math);
