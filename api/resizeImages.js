// 1) Set a device-width viewport
// 2) Set a border or outline on the body
// 3) get document.body.clientWidth
// 4) Give me a goddamn prize
define(["./iter"], function(iter) {

var $ = Mobify.$ || window.$ || { fn: {}};

var absolutify = document.createElement('a')

    // A regex for detecting http(s) URLs.
  , httpRe = /^https?/

    // A protocol relative URL for the host ir0.mobify.com.
  , PROTOCOL_AND_HOST = '//ir0.mobify.com'

    /**
     * Returns a URL suitable for use with the 'ir' service.
     */ 
  , getImageURL = Mobify.getImageURL = function(url, options) {
        options = options || {};

        var bits = [PROTOCOL_AND_HOST];

        if (options.projectName) {
            var projectId = "project-" + options.projectName;
            bits.push(projectId);
        }

        if (options.format) {
            bits.push(options.format + (options.quality || ''));
        }

        if (options.maxWidth) {
            bits.push(options.maxWidth)

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
     * resized.
     */
  , resizeImages = $.fn.resizeImages = function($imgs, options) {
        if (this.appendTo) {
            options = $imgs;
            $imgs = this;
        }

        var opts = Mobify.iter.extend({}, defaults, typeof options == 'object' && options)
          , dpr = window.devicePixelRatio;

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

        [].forEach.call($imgs, function(img) {
            var attr = img.getAttribute(opts.attribute);
            if (attr) {
                absolutify.href = attr;
                var url = absolutify.href;

                if (httpRe.test(url)) {
                    img.setAttribute('x-src', getImageURL(url, opts));
                }
            }
        });

        return $imgs;
    }

  , defaults = {
        selector: 'img[x-src]'
      , attribute: 'x-src'
      , projectName: Mobify.config.projectName || ''
    };

return resizeImages;

});