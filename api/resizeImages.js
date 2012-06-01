// 1) Set a device-width viewport
// 2) Set a border or outline on the body
// 3) get document.body.clientWidth
// 4) Give me a goddamn prize
(function($) {

var absolutify = document.createElement('a')
  , hosts = [
        '//ir0.mobify.com'
      , '//ir1.mobify.com'
      , '//ir2.mobify.com'
      , '//ir3.mobify.com'
    ]
    // Hash `url` into a well distributed int.
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
          
    // Returns a URL suitable for use with irX.mobify.com.
    // :host/:format:quality/:width/:height/:url
  , getImageURL = Mobify.getImageURL = function(url, opts) {
        opts = opts || {}

        var host = hosts[URLHash(url) % hosts.length]
          , bits = [host];

        if (opts.format) {
            bits.push(opts.format + (opts.quality || ''));
        }

        if (opts.maxWidth) {
            bits.push(opts.maxWidth)

            if (opts.maxHeight) {
                bits.push(opts.maxHeight);
            }
        }

        bits.push(url);
        return bits.join('/');
    }

    // Alter the `src` of child images to pass through 
    // irX.mobify.com. Return the set of altered elements.
  , resizeImages = $.fn.resizeImages = function(options) {
        var opts = $.extend(resizeImages.defaults, typeof options == 'object' && options)
          , dpr = window.devicePixelRatio;

        if (typeof options == 'number') {
            opts.maxWidth = options;
        }

        // https://github.com/Modernizr/Modernizr/pull/443
        if (dpr) {
            if (opts.maxWidth) {
                opts.maxWidth = Math.ceil(opts.maxWidth * dpr);
            }

            if (opts.maxHeight) {
                opts.maxHeight = Math.ceil(opts.maxHeight * dpr);
            }
        }

        var $imgs = this.filter(opts.selector).add(this.find(opts.selector));
        return $imgs.each(function() {
            var attr = this.getAttribute(opts.attribute);
            if (attr) {
                absolutify.href = attr;
                // This is slow, but its nice because it preloads the asset.
                //this.src = getImageURL(absolutify.href, opts);
                this.setAttribute('x-src', getImageURL(absolutify.href, opts))
                // this.removeAttribute(opts.attribute);
            }
        });
    };

resizeImages.defaults = {
    selector: 'img[x-src]',
    attribute: 'x-src'
};

})(Mobify.$);