(function(window) {

    var Mobify = window.Mobify
      , $ = Mobify.$
      , _ = Mobify._
      , config = Mobify.config
      , math = Math
      , undefined;

    // ###
    // # Logging
    // ###
        
    debug.die = function() {
        var args = _.toArray(arguments);
        debug.group('(T_T) Fatal error (T_T)')
        debug.error.apply(debug, args);
        debug.groupEnd();

        // unmobify() sets `Mobify.bail` when run. If set, we died in unmobify,
        // and running it again won't help.
        if (!config.isDebug && !Mobify.bail) {
            Mobify.unmobify();
        }

        throw args;
    };

    debug.logGroup = function(fn, title, obj) {
        var noneWritten = true;
        _.each(obj, function(value, key) {
            noneWritten && debug.group(title);
            if (typeof key == "number") {
                debug[fn].apply(window, value);
            } else {
                debug[fn](key, value);
            }
            
            noneWritten = false;
        });

        noneWritten || debug.groupEnd();
    };

    // ###
    // # Utils
    // ###
    
    // Set optout cookie and reload to goto desktop.
    // V3.0: mobify=0
    // V3.X: mobify-js=-1
    // V6.X: mobify-path=
    //
    // `url`: Optional url to redirect to after opting out.
    Mobify.desktop = function(url) {
        var tagVersion = config.tagVersion
          , val = tagVersion > 5 ? '-path=' : (tagVersion ? '-js=-1' : '=0')
        
        document.cookie = 'mobify' + val + '; path=/;';

        if (url) {
            location = url;
        } else {
            location.reload();
        }
    };
    
    // i18n function converts in a list of language types and data and returns
    // a function that allows you to grab translation keys from that data
    Mobify.i18n = function(list, data) {
        list.push("DEFAULT");

        var i18nlookup = function(key) {
            for(var i = 0; i < list.length; i++) {
                // Make sure list[i] is actually in data before we use it
                //  to lookup a key
                var value = (data[list[i]] ? data[list[i]][key] : undefined);
                if (value) return value;
           }
        }
        return i18nlookup;
    };

    Mobify.isIOS8_0 = function() {
        var IOS8_REGEX = /ip(hone|od|ad).*Version\/8.0/i;

        return IOS8_REGEX.test(window.navigator.userAgent);
    };

    /**
     * iOS 8.0 has a bug where dynamically switching the viewport (by swapping the
     * viewport meta tag) causes the viewport to automatically scroll. When
     * capturing, the initial document never has an active meta viewport tag.
     * Then, the rendered document injects one causing the aforementioned scroll.
     *
     * Create a meta viewport tag that we inject into the page to force the page to
     * scroll before anything is rendered in the page (this code should be called
     * before document.open!)
     *
     * JIRA: https://mobify.atlassian.net/browse/GOLD-883
     * Open Radar: http://www.openradar.me/radar?id=5516452639539200
     * WebKit Bugzilla: https://bugs.webkit.org/show_bug.cgi?id=136904
     */
    Mobify.ios8_0ScrollFix = function(doc, callback) {
        // Using `getElementsByTagName` here because grabbing head using
        // `document.head` will throw exceptions in some older browsers (iOS 4.3).
        var head = doc.getElementsByTagName('head');
        // Be extra safe and guard against `head` not existing.
        if (!head.length) {
            return;
        }
        var head = head[0];

        var meta = document.createElement('meta');
        meta.setAttribute('name', 'viewport');
        meta.setAttribute('content', 'width=device-width');
        head.appendChild(meta);

        if (callback) {
            // Wait two paints for the meta viewport tag to take effect. This is
            // required for this fix to work, but guard against it being undefined
            // anyway just in case.
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(function() {
                    window.requestAnimationFrame(callback);
                });
            }
            else {
                callback();
            }
        }
    };

    // ###
    // # SERVICES
    // ###

    // 1) Set a device-width viewport
    // 2) Set a border or outline on the body
    // 3) get document.body.clientWidth
    // 4) Give me a goddamn prize
    (function() {
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
                        opts.maxWidth = math.ceil(opts.maxWidth * dpr);
                    }

                    if (opts.maxHeight) {
                        opts.maxHeight = math.ceil(opts.maxHeight * dpr);
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

    })();
})(this);
