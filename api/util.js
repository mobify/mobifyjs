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
        var IOS8_REGEX = /ip(hone|od|ad).*OS 8_0/i;

        return IOS8_REGEX.test(window.navigator.userAgent);
    };

    /**
     * iOS 8.0 has a bug where dynamically switching the viewport (by swapping the
     * viewport meta tag) causes the viewport to automatically scroll. When
     * capturing, the initial document never has an active meta viewport tag.
     * Then, the rendered document injects one causing the aforementioned scroll.
     *
     * This patches HTML to hide the body until the first paint (and hopefully after
     * the initial viewport is calculated). By the time we show the body the new
     * viewport should have already taken effect.
     *
     * JIRA: https://mobify.atlassian.net/browse/GOLD-883
     * Open Radar: http://www.openradar.me/radar?id=5516452639539200
     * WebKit Bugzilla: https://bugs.webkit.org/show_bug.cgi?id=136904
     */
    Mobify.ios8_0ScrollFix = function(htmlString) {
        var BODY_REGEX = /<body(?:[^>'"]*|'[^']*?'|"[^"]*?")*>/i;

        var openingBodyTag = BODY_REGEX.exec(htmlString);
        // Do nothing if we can't find an opening `body` tag.
        if (!openingBodyTag) {
            return htmlString;
        }
        openingBodyTag = openingBodyTag[0];

        // Use DOM methods to manipulate the attributes on the `body` tag. This
        // lets us rely on the browser to set body's style to `display: none`.
        // We create a containing element to be able to set an inner HTML string.
        var divEl = document.createElement('div');
        
        // The `div`'s inner string can't be a `body` tag, so we temporarily change
        // it to a `div`..
        var openingBodyTagAsDiv = openingBodyTag.replace(/^<body/, '<div');
        divEl.innerHTML = openingBodyTagAsDiv;

        // ..so that we can set it to be hidden..
        divEl.firstChild.style.display = 'none';

        // ..and change it back to a `body` string!
        openingBodyTagAsDiv = divEl.innerHTML.replace(/<\/div>$/, '');
        openingBodyTag = openingBodyTagAsDiv.replace(/^<div/, '<body');

        // Append the script to show the body after two paints. This needs to be
        // inside the body to ensure that `document.body` is available when it
        // executes.
        var script =
            "<script>" +
            "  window.requestAnimationFrame(function() {" +
            "    window.requestAnimationFrame(function() {" +
            "      document.body.style.display = '';" +
            "    });" +
            "  });" +
            "<\/script>";

        return htmlString.replace(BODY_REGEX, openingBodyTag + script);
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
