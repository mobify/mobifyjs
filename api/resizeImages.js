// 1) Set a device-width viewport
// 2) Set a border or outline on the body
// 3) get document.body.clientWidth
// 4) Give me a goddamn prize
(function(window, $) {

var absolutify = document.createElement('a')

  , hosts = [
        '//ir0.mobify.com'
      , '//ir1.mobify.com'
      , '//ir2.mobify.com'
      , '//ir3.mobify.com'
    ]

    , projectName = Mobify.conf.projectName || ""

    /**
     * Hash `url` into a well distributed int.
     */
  , URLHash = Mobify.URLHash = function(url) {
        var hc, len = url.length;

        // Let's hash on 8 different character codes, chosen 
        // progresively back from the end of the URL, and xor 'em
        hc = url.charCodeAt(len - 2 % len) ^ url.charCodeAt(len - 3 % len)
           ^ url.charCodeAt(len - 5 % len) ^ url.charCodeAt(len - 7 % len)
           ^ url.charCodeAt(len - 11 % len) ^ url.charCodeAt(len - 13 % len)
           ^ url.charCodeAt(len - 17 % len) ^ url.charCodeAt(len - 19 % len)

        // A little linear congruential generator action to shuffle 
        // things up, inspired by libc's random number generator
        hc = (((hc * 1103515245) % 4294967296 + 12345) % 4294967296);
        hc = (hc < 0) ? hc + 4294967296: hc;
        return hc;
    }
          
    /**
     * Returns a URL suitable for use with the 'ir' service.
     *  :host/:format:quality/:width/:height/:url
     */ 
  , getImageURL = Mobify.getImageURL = function(url, options) {
        options = options || {}

        var host = hosts[URLHash(url) % hosts.length]
          , bits = [host];

        // If a projectName is set on the conf object, put it in resized image urls
        if(Mobify.conf && Mobify.conf.projectName) {
            var projectName = Mobify.conf.projectName
            var projectIdeintifier = "project-" + projectName
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

        if (typeof options == 'number') {
            opts.maxWidth = options;
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
                this.setAttribute('x-src', getImageURL(absolutify.href, opts))
            }
        });
    }
  , defaults = resizeImages.defaults = {
        selector: 'img[x-src]'
      , attribute: 'x-src'
    }

})(this, Mobify.$);
