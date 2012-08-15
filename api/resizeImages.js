(function(window, $) {

var absolutify = document.createElement('a')
    // A regex for detecting http(s) URLs
  , protocolMatcher = /^http(s)?/

  // A protocol relative URL for the host ir0.mobify.com
  , PROTOCOL_AND_HOST = '//ir0.mobify.com'
          
    /**
     * Returns a URL suitable for use with the 'ir' service.
     *  :host/:format:quality/:width/:height/:url
     */ 
  , getImageURL = Mobify.getImageURL = function(url, options) {
        options = options || {}

        var bits = [PROTOCOL_AND_HOST];

        // If projectName is set on defaults and truthy, put it in resized image urls
        if (defaults.projectName) {
            var projectIdeintifier = "project-" + defaults.projectName;
            bits.push(projectIdeintifier);
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
     * Searches the collection for imgs and modifies them to use the `ir` service.
     * Pass `options` to modify how the images are serviced.
     */
  , resizeImages = $.fn.resizeImages = function(options) {
        var opts = $.extend(defaults, typeof options == 'object' && options)
          , dpr = window.devicePixelRatio
          , $imgs = this.filter(opts.selector).add(this.find(opts.selector))
          , attr;

        // integer width
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

        return $imgs.each(function() {
            if (attr = this.getAttribute(opts.attribute)) {
                absolutify.href = attr;
                var url = absolutify.href;
                // Produce an image resize url only for matched protocols
                if(protocolMatcher.exec(url)) {
                    this.setAttribute('x-src', getImageURL(url, opts));
                }
            }
        });
    }
  , defaults = resizeImages.defaults = {
        selector: 'img[x-src]'
      , attribute: 'x-src'
      , projectName: Mobify.config.projectName || ''
    }

/**
* TODO: Implement automatic maximum non-zoomed displayable size detection:
* 1) Set a device-width viewport
* 2) Set a border or outline on the body
* 3) get document.body.clientWidth
* 4) Give me a goddamn prize
*/
})(this, Mobify.$);
