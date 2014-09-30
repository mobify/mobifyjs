(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['mobifyjs/utils'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('../mobifyjs-utils/utils.js'));
    } else {
        // Browser globals (root is window)
        root.ResizeImages = factory(root.Utils);
    }
}(this, function (Utils) {

var ResizeImages = window.ResizeImages = {};

var localStorageWebpKey = 'Mobify-Webp-Support-v2';

function persistWebpSupport(supported) {
    if (Utils.supportsLocalStorage()) {
        var webpSupport = {
            supported: supported,
            date: Date.now()
        };
        localStorage.setItem(localStorageWebpKey, JSON.stringify(webpSupport));
    }
}

/**
 * Synchronous WEBP detection using regular expressions
 * Credit to Ilya Grigorik for WEBP regex matching
 * https://github.com/igrigorik/webp-detect/blob/master/pagespeed.cc
 * Modified to exclude Android native browser on Android 4
 */
ResizeImages.userAgentWebpDetect = function(userAgent){
    var supportedRe = /(Android\s|Chrome\/|Opera9.8*Version\/..\.|Opera..\.)/i;
    var unsupportedVersionsRe = new RegExp('(Android\\s(0|1|2|3|(4(?!.*Chrome)))\\.)|(Chrome\\/[0-8]\\.)' +
                                '|(Chrome\\/9\\.0\\.)|(Chrome\\/1[4-6]\\.)|(Android\\sChrome\\/1.\\.)' +
                                '|(Android\\sChrome\\/20\\.)|(Chrome\\/(1.|20|21|22)\\.)' +
                                '|(Opera.*(Version/|Opera\\s)(10|11)\\.)', 'i');

    // Return false if browser is not supported
    if (!supportedRe.test(userAgent)) {
        return false;
    }

    // Return false if a specific browser version is not supported
    if (unsupportedVersionsRe.test(userAgent)) {
        return false;
    }
    return true;
};

/**
 * Asychronous WEB detection using a data uri.
 * Credit to Modernizer:
 * https://github.com/Modernizr/Modernizr/blob/fb76d75fbf97f715e666b55b8aa04e43ef809f5e/feature-detects/img-webp.js
 */
ResizeImages.dataUriWebpDetect = function(callback) {
    var image = new Image();
    image.onload = function() {
        var support = (image.width === 1) ? true : false;
        persistWebpSupport(support);
        if (callback) callback(support);
        };
    // this webp generated with Mobify image resizer from 
    // http://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png passed 
    // through the Mobify Image resizer: 
    // http://ir0.mobify.com/webp/http://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png
    image.src = 'data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQABgBwlpAADcAD+/gbQAA==';
};

/**
 * Detect WEBP support sync and async. Do our best to determine support
 * with regex, and use data-uri method for future proofing.
 * (note: async test will not complete before first run of `resize`,
 * since onload of detector image won't fire until document is complete)
 * Also caches results for WEBP support in localStorage.
 */
ResizeImages.supportsWebp = function(callback) {

    // Return early if we have persisted WEBP support
    if (Utils.supportsLocalStorage()) {
        
        // Check if WEBP support has already been detected
        var webpSupport;
        var storedSupport = localStorage.getItem(localStorageWebpKey);

        // Only JSON.parse if storedSupport is not null, or else things
        // will break on Android 2.3
        storedSupport && (webpSupport = JSON.parse(storedSupport));
        
        // Grab previously cached support value in localStorage.
        if (webpSupport && (Date.now() - webpSupport.date < 604800000)) {
            return webpSupport.supported;
        }
    }

    // Run async WEBP detection for future proofing
    // This test may not finish running before the first call of `resize`
    ResizeImages.dataUriWebpDetect(callback);

    // Run regex based synchronous WEBP detection
    var support = ResizeImages.userAgentWebpDetect(navigator.userAgent);

    persistWebpSupport(support);

    return support;

};

/**
 * Returns a URL suitable for use with the 'ir' service.
 */
ResizeImages.getImageURL = function(url, options) {
    var opts = options;
    if (!opts) {
        opts = ResizeImages.processOptions();
    }
    var bits = [opts.proto + opts.host];

    if (opts.projectName) {
        var projectId = "project-" + opts.projectName;
        bits.push(projectId);
    }

    if (opts.cacheBreaker) {
        bits.push('cb' + opts.cacheBreaker);
    }

    if (opts.cacheHours) {
        bits.push('c' + opts.cacheHours);
    }

    if (opts.format) {
        bits.push(opts.format + (opts.quality || ''));
    } else if (opts.quality) {
        bits.push('q' + opts.quality);
    }

    if (opts.maxWidth) {
        bits.push(opts.maxWidth);

        if (opts.maxHeight) {
            bits.push(opts.maxHeight);
        }
    }

    bits.push(url);
    return bits.join('/');
};

/**
 * Replaces src attr of passed element with value of running `getImageUrl` on it
 * Allows overriding of img.getAttribute(x-src) with srcVal
 */

ResizeImages._rewriteSrcAttribute = function(element, opts, srcVal){
    srcVal = element.getAttribute(opts.sourceAttribute) || srcVal;
    if (srcVal) {
        var url = Utils.absolutify(srcVal);
        if (Utils.httpUrl(url)) {
            if (opts.onerror) {
                element.setAttribute('onerror', opts.onerror);
            }
            element.setAttribute(opts.targetAttribute, ResizeImages.getImageURL(url, opts));
            element.setAttribute('data-orig-src', srcVal);
            // if using resize when not capturing, remove the sourceAttribute
            // as long as it's not "src", which is the target attribute used
            // when not capturing.
            if (!capturing && opts.sourceAttribute != opts.targetAttribute) {
                element.removeAttribute(opts.sourceAttribute);
            }
        }
    }
};

/**
 * Modifies src of `<source />` children of a `<picture>` element to use image 
 * resizer
 */
ResizeImages._resizeSourceElement = function(element, opts, rootSrc) {
    // Grab optional width override
    var width = element.getAttribute('data-width');
    var localOpts = opts;
    if (width) {
        localOpts = Utils.clone(opts);
        localOpts.maxWidth = width;
    }
    // pass along rootSrc if defined on `picture` element
    ResizeImages._rewriteSrcAttribute(element, localOpts, rootSrc);
};

/**
 * Takes a picture element and calls _resizeSourceElement on its `<source />` 
 * children
 */
ResizeImages._crawlPictureElement = function(el, opts) {
    var sources = el.getElementsByTagName('source');
    // If source elements are erased from the dom, leave the
    // picture element alone.
    if (sources.length === 0 || el.hasAttribute('mobify-optimized')) {
        return;
    }
    el.setAttribute('mobify-optimized', '');

    // Grab optional `data-src` attribute on `picture`.
    // Used for preventing writing the same src multiple times for
    // different `source` elements.
    var rootSrc = el.getAttribute('data-src');

    // resize the sources
    for(var i =  0, len = sources.length; i < len; i++) {
        ResizeImages._resizeSourceElement(sources[i], opts, rootSrc);
    }
};

/**
 * Searches a list of target dimensions for the smallest one that is greater than 
 * the passed value and return it, or return the greatst value if none are 
 * greater.
 *
 * Popular device resolutions: 
 * iPhone 3Gs - 320x480
 * iPhone 4 - 640x960
 * iPhone 5 - 650x1156
 * 
 * Galaxy SIII/Nexus 4/Nexus 7 - 720x1280
 * Galaxy SIV/Nexus 5 - 1080x1920
 * 
 * iPad (non-retina) - 1024x768
 * iPad (retina) - 2048x1536
 *
 * A larger list of target dimensions would include 720px, 800px, 1024px, 1280px 
 * and 1920px but they have been omitted due tot heir proximity to other, larger 
 * values
 */
var targetDims = [320, 640, 768, 1080, 1536, 2048, 4000];
ResizeImages._getBinnedDimension = function(dim) {
    var resultDim = 0;

    for (var i = 0, len = targetDims.length; i < len; i++) {
        resultDim = targetDims[i];
        if (resultDim >= dim) {
            break;
        }
    }
    return resultDim;
};

/**
 * Returns a boolean that indicates whether images should be resized.
 * Looks for the viewport meta tag and parses it to determine whether the
 * website is responsive (the viewport is set to the device's width). This
 * ensures that images that are part of a larger viewport are not scaled.
 */
ResizeImages._shouldResize = function(document) {
    var metaViewport = Utils.getMetaViewportProperties(document);
    if (!metaViewport) {
        return false;
    }

    // It's complicated, but what we want to know is whether the viewport
    // matches the 'ideal viewport'. If either `initial-scale` is 1 or `width`
    // is device-width or both, then the viewport will match the 'ideal
    // viewport'. There are a few other special circumstances under which the
    // viewport could be ideal, but we can't test for them.
    //
    // See: http://www.quirksmode.org/mobile/metaviewport/

    // Ideal viewport when width=device-width
    if (!metaViewport['initial-scale'] && metaViewport['width']) {
        return metaViewport['width'] == 'device-width';
    }

    // Ideal viewport when initial-scale=1
    if (!metaViewport['width'] && metaViewport['initial-scale']) {
        return metaViewport['initial-scale'] == '1';
    }

    // Ideal viewport when width=device-width and the intial-scale is 1 or more
    // (in that case it's just zoomed)
    if (metaViewport['width'] && metaViewport['initial-scale']) {
        initialScale = parseInt(metaViewport['initial-scale'], 10);
        return initialScale >= 1 && metaViewport['width'] == 'device-width';
    }

    return false;
};

/**
 * Processes options passed to `resize()`. Takes an options object that 
 * potentially has height and width set in css pixels, returns an object where 
 * they are expressed in device pixels, and other default options are set.
 */
ResizeImages.processOptions = function(options) {
    var opts = Utils.clone(ResizeImages.defaults);
    if (options) {
        Utils.extend(opts, options);
    }

    // A null value for `resize` triggers the auto detect functionality. This
    // uses the document to determine whether images should be resized and sets
    // it as the new default.
    if (opts.resize === null && options.document) {
        var resize = ResizeImages._shouldResize(options.document);
        ResizeImages.defaults.resize = opts.resize = resize;
    }

    if (!opts.format && opts.webp) {
        opts.format = "webp";
    }

    // Without `resize` images are served through IR without changing their dimensions
    if (!opts.resize) {
        opts.maxWidth = opts.maxHeight = opts.devicePixelRatio = null;
    }
    else {
        var dpr = opts.devicePixelRatio || window.devicePixelRatio;

        var screenSize = Utils.getPhysicalScreenSize(dpr);

        // If maxHeight/maxWidth are not specified, use screen dimensions
        // in device pixels
        var width = opts.maxWidth || ResizeImages._getBinnedDimension(screenSize.width);
        var height = opts.maxHeight || undefined;

        // Otherwise, compute device pixels
        if (dpr && opts.maxWidth) {
            width = width * dpr;
            if (opts.maxHeight) {
                height = height * dpr;
            }
        }

        // round up in case of non-integer device pixel ratios
        opts.maxWidth = Math.ceil(width);
        if (opts.maxHeight && height) {
            opts.maxHeight = Math.ceil(height);
        }
    }

    return opts;
};

/**
 * Searches the collection for image elements and modifies them to use
 * the Image Resize service. Pass `options` to modify how the images are 
 * resized.
 */
ResizeImages.resize = function(elements, options) {
    // Return early if elements is empty
    if (!elements.length) {
        return;
    }

    // Supplement `options` with the document from the first element
    if (options && !options.document) {
        options.document = elements[0].ownerDocument;
    }
    var opts = ResizeImages.processOptions(options);

    for(var i=0; i < elements.length; i++) {
        var element = elements[i];

        // For an `img`, simply modify the src attribute
        if (element.nodeName === 'IMG' && !element.hasAttribute('mobify-optimized')) {
            element.setAttribute('mobify-optimized', '');
            ResizeImages._rewriteSrcAttribute(element, opts);
        }
        // For a `picture`, (potentially) nuke src on `img`, and
        // pass all `source` elements into modifyImages recursively
        else if (element.nodeName === 'PICTURE') {
            ResizeImages._crawlPictureElement(element, opts);
        }
    }

    return elements;
};

ResizeImages.restoreOriginalSrc = function(event) {
    var origSrc;
    event.target.removeAttribute('onerror'); // remove ourselves
    origSrc = event.target.getAttribute('data-orig-src');
    if (origSrc) {
        event.target.setAttribute('src', origSrc);
    }
};

var capturing = window.Mobify && window.Mobify.capturing || false;

ResizeImages.defaults = {
    cacheHours: 8,
    proto: '//',
    host: 'ir0.mobify.com',
    projectName: "oss-" + location.hostname.replace(/[^\w]/g, '-'),
    sourceAttribute: "x-src",
    targetAttribute: (capturing ? "x-src" : "src"),
    webp: ResizeImages.supportsWebp(),
    resize: true,
    onerror: 'ResizeImages.restoreOriginalSrc(event);'
};

ResizeImages.profiles = {
    SHORT_CACHE: {
        cacheHours: 2
    },
    LONG_CACHE: {
        cacheHours: 168
    }
};

return ResizeImages;
}));

},{"../mobifyjs-utils/utils.js":3}],2:[function(require,module,exports){
/**
 * The Jazzcat client is a library for loading JavaScript from the Jazzcat
 * webservice. Jazzcat provides a JSONP HTTP endpoint for fetching multiple HTTP
 * resources with a single HTTP request. This is handy if you'd to request a
 * number of JavaScript files in a single request.
 *
 * The client is designed to work with Capturing in a "drop in" manner and as such is
 * optimized for loading collections of scripts on a page through Jazzcat,
 * rather than fetching specific scripts.
 *
 * The client cannot rely on the browser's cache to store Jazzcat responses. Imagine
 * page one with external scripts a and b and page two with script a. Visitng
 * page one and then page two results in a cache miss because each set of scripts
 * generate different requests to Jazzcat.
 *
 * To work around this, the client implements a cache over localStorage for caching
 * the results of requests to Jazzcat.
 *
 * Scripts that should use the client must be passed to `Jazzcat.optimizeScripts`
 * during the capturing phase. During execution, uncached scripts are loaded
 * into the cache using a bootloader request to Jazzcat. Scripts are then
 * executed directly from the cache.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(["mobifyjs/utils"], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        var Utils = require('../mobifyjs-utils/utils.js');
        module.exports = factory(Utils);
    } else {
        // Browser globals (root is window)
        root.Jazzcat = factory(root.Utils);
    }
}(this, function (Utils) {
    /**
     * An HTTP 1.1 compliant localStorage backed cache.
     */
    var httpCache = {
        cache: {},
        options: {},
        utils: {}
    };

    var localStorageKey = 'Mobify-Jazzcat-Cache-v1.0';

    /**
     * Reset the cache, optionally to `val`. Useful for testing.
     */
    httpCache.reset = function(val) {
        httpCache.cache = val || {};
    };

    /**
     * Returns value of `key` if it is in the cache and marks it as used now if 
     * `touch` is true.
     */
    httpCache.get = function(key, touch) {
        // Ignore anchors.
        var resource = httpCache.cache[key.split('#')[0]];
        if (resource && touch) {
            resource.lastUsed = Date.now();
        }
        return resource;
    };

    /**
     * Set `key` to `val` in the cache.
     */
    httpCache.set = function(key, val) {
        httpCache.cache[key] = val;
    };

    /**
     * Load the cache into memory, skipping stale resources.
     */
    httpCache.load = function(options) {
        var data = localStorage.getItem(localStorageKey);
        var key;
        var staleOptions;

        if (options && options.overrideTime !== undefined) {
            staleOptions = {overrideTime: options.overrideTime};
        }

        if (!data) {
            return;
        }

        try {
            data = JSON.parse(data);
        } catch(err) {
            return;
        }
        for (key in data) {
            if (data.hasOwnProperty(key) && !httpCache.utils.isStale(data[key], staleOptions)) {
                httpCache.set(key, data[key]);
            }
        }
    };

    /**
     * Save the in-memory cache to localStorage. If the localStorage is full,
     * use LRU to drop resources until it will fit on disk, or give up after 10
     * attempts.
     */

    // save mutex to prevent multiple concurrent saves and saving before `load` 
    // event for document
    var canSave = true;
    httpCache.save = function(callback) {
        var attempts = 10;
        var resources;
        var key;

        // prevent multiple saves before onload
        if (!canSave) {
            return callback && callback("Save currently in progress");
        }
        canSave = false;

        // Serialize the cache for storage. If the serialized data won't fit,
        // evict an item and try again. Use `setTimeout` to ensure the UI stays
        // responsive even if a number of resources are evicted.
        (function persist() {
            var store = function() {
                var resource;
                var serialized;
                // End of time.
                var lruTime = 9007199254740991;
                var lruKey;
                resources = resources || Utils.clone(httpCache.cache);
                try {
                    serialized = JSON.stringify(resources);
                } catch(e) {
                    canSave = true;
                    return callback && callback(e);
                }

                try {
                    localStorage.setItem(localStorageKey, serialized);
                // The serialized data won't fit. Remove the least recently used
                // resource and try again.
                } catch(e) {
                    if (!--attempts) {
                        canSave = true;
                        return callback && callback(e);
                    }
                    // Find the least recently used resource.
                    for (var key in resources) {
                        if (!resources.hasOwnProperty(key)) continue;
                        resource = resources[key];

                        if (resource.lastUsed) {
                            if (resource.lastUsed <= lruTime) {
                                lruKey = key;
                                lruTime = resource.lastUsed;
                            }
                        // If a resource has not been used, it's the LRU.
                        } else {
                            lruKey = key;
                            lruTime = 0;
                            break;
                        }
                    }
                    delete resources[lruKey];

                    return persist();
                }

                canSave = true;
                callback && callback();
            };
            if (Utils.domIsReady()) {
                store();
            }
            else {
                setTimeout(persist, 15);
            }
        })();
    };

    // Regular expressions for cache-control directives.
    // See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9
    var ccDirectives = /^\s*(public|private|no-cache|no-store)\s*$/;
    var ccMaxAge = /^\s*(max-age)\s*=\s*(\d+)\s*$/;

    /**
     * Returns a parsed HTTP 1.1 Cache-Control directive from a string `directives`.
     */
    httpCache.utils.ccParse = function(directives) {
        var obj = {};
        var match;

        directives.split(',').forEach(function(directive) {
            if (match = ccDirectives.exec(directive)) {
                obj[match[1]] = true;
            } else if (match = ccMaxAge.exec(directive)) {
                obj[match[1]] = parseInt(match[2], 10);
            }
        });

        return obj;
    };

    /**
     * Returns `false` if a response is "fresh" by HTTP/1.1 caching rules or 
     * less than ten minutes old. Treats invalid headers as stale.
     */
    httpCache.utils.isStale = function(resource, options) {
        var ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
        var headers = resource.headers || {};
        var cacheControl = headers['cache-control'];
        var now = Date.now();
        var date = Date.parse(headers['date']);
        var expires;
        var lastModified = headers['last-modified'];
        var age;
        var modifiedAge;
        var overrideTime;

        // Fresh if less than 10 minutes old
        if (date && (now < date + 600 * 1000)) {
            return false;
        }

        // If a cache override parameter is present, see if the age of the 
        // response is less than the override, cacheOverrideTime is in minutes, 
        // turn it off by setting it to false
        if (options && (overrideTime = options.overrideTime) && date) {
            return (now > (date + (overrideTime * 60 * 1000)));
        }

        // If `max-age` and `date` are present, and no other cache
        // directives exist, then we are stale if we are older.
        if (cacheControl && date) {
            cacheControl = httpCache.utils.ccParse(cacheControl);

            if ((cacheControl['max-age']) &&
                (!cacheControl['no-store']) &&
                (!cacheControl['no-cache'])) {
                // Convert the max-age directive to ms.
                return now > (date + (cacheControl['max-age'] * 1000));
            } else {
                // there was no max-age or this was marked no-store or 
                // no-cache, and so is stale
               return true;
            }
        }

        // If `expires` is present, we are stale if we are older.
        if (headers.expires && (expires = Date.parse(headers.expires))) {
            return now > expires;
        }

        // Fresh if less than 10% of difference between date and 
        // last-modified old, up to a day
        if (lastModified && (lastModified = Date.parse(lastModified)) && date) {
            modifiedAge = date - lastModified;
            age = now - date;
            // If the age is less than 10% of the time between the last 
            // modification and the response, and the age is less than a 
            // day, then it is not stale
            if ((age < 0.1 * modifiedAge) && (age < ONE_DAY_IN_MS)) {
                return false;
            }
        }

        // Otherwise, we are stale.
        return true;
    };

    var Jazzcat = window.Jazzcat = {
        httpCache: httpCache,
        // Cache a reference to `document.write` in case it is reassigned.
        write: document.write
    };

    // No support for Firefox <= 11, Opera 11/12, browsers without
    // window.JSON, and browsers without localstorage.
    // All other unsupported browsers filtered by mobify.js tag.
    Jazzcat.isIncompatibleBrowser = function(userAgent) {
        var match = /(firefox)[\/\s](\d+)|(opera[\s\S]*version[\/\s](11|12))/i.exec(userAgent || navigator.userAgent);
        // match[1] == Firefox <= 11, // match[3] == Opera 11|12
        // These browsers have problems with document.write after a document.write
        if ((match && match[1] && +match[2] < 12) || (match && match[3])
             || (!Utils.supportsLocalStorage())
             || (!window.JSON)) {
            return true;
        }

        return false;
    };

    /**
     * Alter the array of scripts, `scripts`, into calls that use the Jazzcat
     * service. Roughly:
     *
     *   Before:
     *
     *   <script src="http://code.jquery.com/jquery.js"></script>
     *   <script>$(function() { alert("helo joe"); })</script>
     *
     *   After:
     *
     *   <script>Jazzcat.httpCache.load();<\/script>
     *   <script src="//jazzcat.mobify.com/jsonp/Jazzcat.load/http%3A%2F%2Fcode.jquery.com%2Fjquery.js"></script>
     *   <script>Jazzcat.exec("http://code.jquery.com/jquery.js")</script>
     *   <script>$(function() { alert("helo joe"); })</script>
     *
     * 
     * Takes an option argument, `options`, an object whose properties define 
     * options that alter jazzcat's javascript loading, caching and execution 
     * behaviour. Right now the options default to `Jazzcat.defaults` which
     * can be overridden. More details on options:
     *
     * - `cacheOverrideTime` :  An integer value greater than 10 that will 
     *                          override the freshness implied by the HTTP 
     *                          caching headers set on the reource.
     * - `responseType` :       This value defaults to `jsonp`, which will
     *                          make a request for a jsonp response which
     *                          loads scripts into the httpCache object.
     *                          Can also specify `js`, which will send back
     *                          a plain JavaScript response, which does not
     *                          use localStorage to manage script caching.
     *                          (warning - `js` responses are currently
     *                          experimental and may have issues with cache
     *                          headers).
     * - `concat`:              A boolean that specifies whether or not script
     *                          requests should be concatenated (split between
     *                          head and body).
     */
    // `loaded` indicates if we have loaded the cached and inserted the loader
    // into the document
    Jazzcat.cacheLoaderInserted = false;
    Jazzcat.optimizeScripts = function(scripts, options) {
        options = options || {};
        
        if (options && options.cacheOverrideTime !== undefined) {
            Utils.extend(httpCache.options,
              {overrideTime: options.cacheOverrideTime});
        }

        scripts = Array.prototype.slice.call(scripts);

        // Fastfail if there are no scripts or if required features are missing.
        if (!scripts.length || Jazzcat.isIncompatibleBrowser()) {
            return scripts;
        }

        options = Utils.extend({}, Jazzcat.defaults, options || {});
        var concat = options.concat;
        // A Boolean to control whether the loader is inlined into the document, 
        // or only added to the returned scripts array
        var inlineLoader = ((options.inlineLoader !== undefined) ?
          options.inlineLoader: true);

        // helper method for inserting the loader script
        // before the first uncached script in the "uncached" array
        var insertLoaderInContainingElement = function(script, urls) {
            if (script) {
                var loader = Jazzcat.getLoaderScript(urls, options);
                // insert the loader directly before the script
                script.parentNode.insertBefore(loader, script);
            }
        };
        // helper for appending loader script into an array before the 
        // referenced script
        var appendLoaderForScriptsToArray = function(array, urls) {
            var loader = Jazzcat.getLoaderScript(urls, options);
            array.push(loader);
        };

        var url;
        var toConcat = {
            'head': {
                firstScript: undefined,
                urls: [],
                scripts: []
            },
            'body': {
                firstScript: undefined,
                urls: [],
                scripts: []
            }
        };

        // an array to accumulate resulting scripts in and later return
        var resultScripts = [];

        for (var i=0, len=scripts.length; i<len; i++) {
            var script = scripts[i];

            // Skip script if it has been optimized already, or if you have a "skip-optimize" class
            if (script.hasAttribute('mobify-optimized') ||
                script.hasAttribute('skip-optimize') ||
                /mobify/i.test(script.className)){
                continue;
            }

            // skip if modifying inline, append to results otherwise
            url = script.getAttribute(options.attribute);
            if (!url) {
                if (inlineLoader) {
                    continue;
                } else {
                    resultScripts.push(script);
                    continue;
                }
            }
            url = Utils.absolutify(url);
            if (!Utils.httpUrl(url)) {
                continue;
            }

            // TODO: Check for async/defer

            // Load what we have in http cache, and insert loader into document 
            // or result array
            if (!Jazzcat.cacheLoaderInserted) {
                httpCache.load(httpCache.options);
                var httpLoaderScript = Jazzcat.getHttpCacheLoaderScript(options);
                if (inlineLoader) {
                    script.parentNode.insertBefore(httpLoaderScript, script);
                } else {
                    resultScripts.push(httpLoaderScript);
                }
                // ensure this doesn't happen again for this page load
                Jazzcat.cacheLoaderInserted = true;
            }

            var parent;
            if (inlineLoader) {
                parent = (script.parentNode.nodeName === "HEAD" ? "head" : "body");
            } else {
                // If we're not going to use the inline loader, we'll do 
                // something terrible and put everything into the head bucket
                parent = 'head';
            }

            // if: the script is not in the cache, add a loader
            // else: queue for concatenation
            if (!httpCache.get(url)) {
                if (!concat) {
                    if (inlineLoader) {
                        insertLoaderInContainingElement(script, [url]);
                    } else {
                        appendLoaderForScriptsToArray(resultScripts, [url]);
                    }
                } else {
                    toConcat[parent].urls.push(url);
                    // Remember details of first uncached script
                    if (toConcat[parent].firstScript === undefined) {
                        toConcat[parent].firstScript = script;
                        var firstUncachedScriptIndex = resultScripts.length;
                    }
                }
            }
            script.type = 'text/mobify-script';
            // Rewriting script to grab contents from our in-memory cache
            // ex. <script>Jazzcat.exec("http://code.jquery.com/jquery.js")</script>
            if (script.hasAttribute('onload')){
                var onload = script.getAttribute('onload');
                script.innerHTML =  options.execCallback + "('" + url + "', '" + onload.replace(/'/g, '\\\'') + "');";
                script.removeAttribute('onload');
            } else {
                script.innerHTML =  options.execCallback + "('" + url + "');";
            }

            // Remove the src attribute
            script.removeAttribute(options.attribute);
            
            // Enqueue the script to be returned
            if (!inlineLoader) {
                resultScripts.push(script);
            }

        }
        // insert the loaders for uncached head and body scripts if
        // using concatenation
        if (concat) {
            if (inlineLoader) {
                insertLoaderInContainingElement(toConcat['head'].firstScript,
                                                toConcat['head'].urls);
                insertLoaderInContainingElement(toConcat['body'].firstScript,
                                                toConcat['body'].urls);
            } else {
                // splice in loader for uncached scripts if there are any
                if (firstUncachedScriptIndex) {
                    var loader = Jazzcat.getLoaderScript(toConcat['head'].urls, options);
                    resultScripts.splice(firstUncachedScriptIndex, 0, loader);
                }
            }
        }

        // If the loader was inlined, return the original set of scripts
        if (inlineLoader) {
            return scripts;
        }
        // Otherwise return the generated list
        return resultScripts;
    };

    /**
     * Private helper that returns a script node that when run, loads the 
     * httpCache from localStorage.
     */
    Jazzcat.getHttpCacheLoaderScript = function(options) {
        var loadFromCacheScript = document.createElement('script');
        loadFromCacheScript.type = 'text/mobify-script';
        loadFromCacheScript.innerHTML = (httpCache.options.overrideTime ?
          options.cacheLoadCallback + "(" + JSON.stringify(httpCache.options) + ");" :
          options.cacheLoadCallback + "();" );

        return loadFromCacheScript;
    };

    /**
     * Returns an array of scripts suitable for loading Jazzcat's localStorage 
     * cache and loading any uncached scripts through the jazzcat service. Takes
     * a list of URLs to load via the service (possibly empty), the name of the 
     * jsonp callback used in loading the service's response and a boolean of 
     * whether we expect the cache to have been loaded from localStorage by this 
     * point.
     */
    Jazzcat.getLoaderScript = function(urls, options) {
        var loadScript;
        if (urls && urls.length) {
            loadScript = document.createElement('script');
            // Set the script to "optimized"
            loadScript.setAttribute('mobify-optimized', '');
            loadScript.setAttribute(options.attribute, Jazzcat.getURL(urls, options));
        }
        return loadScript;
    };

    /**
     * Returns a URL suitable for loading `urls` from Jazzcat, calling the
     * function `jsonpCallback` on complete. `urls` are sorted to generate
     * consistent URLs.
     */
    Jazzcat.getURL = function(urls, options) {
        var options = Utils.extend({}, Jazzcat.defaults, options || {});
        return options.base +
               (options.projectName ? '/project-' + options.projectName : '') +
               (options.cacheBreaker ? '/cb' + options.cacheBreaker : '') +
               '/' + options.responseType +
               (options.responseType === 'jsonp' ? '/' + options.loadCallback : '') +
               '/' + encodeURIComponent(JSON.stringify(urls.slice().sort()));
    };

    var scriptSplitRe = /(<\/scr)(ipt\s*>)/ig;

    /**
     * Execute the script at `url` using `document.write`. If the scripts
     * can't be retrieved from the cache, load it using an external script.
     */
    Jazzcat.exec = function(url, onload) {
        var resource = httpCache.get(url, true);
        var out;
        var onloadAttrAndVal = '';
        if (onload) {
            onload = ';' + onload + ';';
            onloadAttrAndVal = ' onload="' + onload + '"';
        } else {
            onload = '';
        }

        if (!resource) {
            out = 'src="' + url + '"' + onloadAttrAndVal + '>';
        } else {
            out = 'data-orig-src="' + url + '"';
            // Explanation below uses [] to stand for <>.
            // Inline scripts appear to work faster than data URIs on many OSes
            // (e.g. Android 2.3.x, iOS 5, likely most of early 2013 device market)
            //
            // However, it is not safe to directly convert a remote script into an
            // inline one. If there is a closing script tag inside the script,
            // the script element will be closed prematurely.
            //
            // To guard against this, we need to prevent script element spillage.
            // This is done by replacing [/script] with [/scr\ipt] inside script
            // content. This transformation renders closing [/script] inert.
            //
            // The transformation is safe. There are three ways for a valid JS file
            // to end up with a [/script] character sequence:
            // * Inside a comment - safe to alter
            // * Inside a string - replacing 'i' with '\i' changes nothing, as
            //   backslash in front of characters that need no escaping is ignored.
            // * Inside a regular expression starting with '/script' - '\i' has no
            //   meaning inside regular expressions, either, so it is treated just
            //   like 'i' when expression is matched.
            //
            // Talk to Roman if you want to know more about this.
            out += '>' + resource.body.replace(scriptSplitRe, '$1\\$2') + onload;
        }

        // `document.write` is used to ensure scripts are executed in order,
        // as opposed to "as fast as possible"
        // http://hsivonen.iki.fi/script-execution/
        // http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
        // This call seems to do nothing in Opera 11/12
        Jazzcat.write.call(document, '<script ' + out +'<\/script>');
    };

    /**
     * Load the cache and populate it with the results of the Jazzcat
     * response `resources`.
     */
    Jazzcat.load = function(resources) {
        var resource;
        var i = 0;
        var save = false;

        // All the resources are already in the cache.
        if (!resources) {
            return;
        }

        while (resource = resources[i++]) {
            // filter out error statuses and status codes
            if (resource.status == 'ready' && resource.statusCode >= 200 &&
                resource.statusCode < 300) {

                save = true;
                httpCache.set(encodeURI(resource.url), resource);
            }
        }
        if (save) {
            httpCache.save();
        }
    };

    Jazzcat.defaults = {
        selector: 'script',
        attribute: 'x-src',
        base: '//jazzcat.mobify.com',
        responseType: 'jsonp',
        execCallback: 'Jazzcat.exec',
        loadCallback: 'Jazzcat.load',
        cacheLoadCallback: 'Jazzcat.httpCache.load',
        inlineLoader: 'true',
        concat: false,
        projectName: '',
    };

    return Jazzcat;
}));

},{"../mobifyjs-utils/utils.js":3}],3:[function(require,module,exports){
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Utils = factory();
    }
}(this, function () {

// ##
// # Utility methods
// ##

var Utils = {};

Utils.extend = function(target){
    [].slice.call(arguments, 1).forEach(function(source) {
        for (var key in source)
            if (source[key] !== undefined)
                target[key] = source[key];
    });
    return target;
};

Utils.keys = function(obj) {
    var result = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            result.push(key);
    }
    return result;
};

Utils.values = function(obj) {
    var result = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
          result.push(obj[key]);
    }
    return result;
};

Utils.clone = function(obj) {
    var target = {};
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          target[i] = obj[i];
        }
    }
    return target;
};

// Some url helpers
/**
 * Takes a url, relative or absolute, and absolutizes it relative to the current 
 * document's location/base, with the assistance of an a element.
 */
var _absolutifyAnchor = document.createElement("a");
Utils.absolutify = function(url) {
    _absolutifyAnchor.href = url;
    return _absolutifyAnchor.href;
};

/**
 * Takes an absolute url, returns true if it is an http/s url, false otherwise 
 * (e.g. mailto:, gopher://, data:, etc.)
 */
var _httpUrlRE = /^https?/;
Utils.httpUrl = function(url) {
    return _httpUrlRE.test(url);
};

/**
 * outerHTML polyfill - https://gist.github.com/889005
 */
Utils.outerHTML = function(el){
    if (el.outerHTML) {
        return el.outerHTML;
    }
    else {
        var div = document.createElement('div');
        div.appendChild(el.cloneNode(true));
        var contents = div.innerHTML;
        div = null;
        return contents;
    }
};

/**
 * Return a string for the doctype of the current document.
 */
Utils.getDoctype = function(doc) {
    doc = doc || document;
    var doctypeEl = doc.doctype || [].filter.call(doc.childNodes, function(el) {
            return el.nodeType == Node.DOCUMENT_TYPE_NODE
        })[0];

    if (!doctypeEl) return '';

    return '<!DOCTYPE HTML'
        + (doctypeEl.publicId ? ' PUBLIC "' + doctypeEl.publicId + '"' : '')
        + (doctypeEl.systemId ? ' "' + doctypeEl.systemId + '"' : '')
        + '>';
};

/**
 * Returns an object that represents the parsed content attribute of the
 * viewport meta tag. Returns false if no viewport meta tag is present.
 */
Utils.getMetaViewportProperties = function(doc) {
    // Regex to split comma-delimited viewport meta tag properties
    var SPLIT_PROPERTIES_REGEX = /,\s?/;

    doc = doc || document;
    var parsedProperties = {}

    // Get the viewport meta tag
    var viewport = doc.querySelectorAll('meta[name="viewport"]');
    if (viewport.length == 0) {
        return false;
    }

    // Split its properties
    var content = viewport[0].getAttribute('content');
    if (content == null) {
        return false;
    }
    var properties = content.split(SPLIT_PROPERTIES_REGEX);

    // Parse the properties into an object
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i].split('=')

        if (property.length >= 2) {
            var key = property[0];
            var value = property[1];
            parsedProperties[key] = value;
        }
    }

    return parsedProperties;
}

Utils.removeBySelector = function(selector, doc) {
    doc = doc || document;

    var els = doc.querySelectorAll(selector);
    return Utils.removeElements(els, doc);
};

Utils.removeElements = function(elements, doc) {
    doc = doc || document;

    for (var i=0,ii=elements.length; i<ii; i++) {
        var el = elements[i];
        el.parentNode.removeChild(el);
    }
    return elements;
};

// localStorage detection as seen in such great libraries as Modernizr
// https://github.com/Modernizr/Modernizr/blob/master/feature-detects/storage/localstorage.js
// Exposing on Jazzcat for use in qunit tests
var cachedLocalStorageSupport;
Utils.supportsLocalStorage = function() {
    if (cachedLocalStorageSupport !== undefined) {
        return cachedLocalStorageSupport;
    }
    var mod = 'modernizr';
    try {
        localStorage.setItem(mod, mod);
        localStorage.removeItem(mod);
        cachedLocalStorageSupport = true;
    } catch(e) {
        cachedLocalStorageSupport = false
    }
    return cachedLocalStorageSupport;
};

// matchMedia polyfill generator
// (allows you to specify which document to run polyfill on)
Utils.matchMedia = function(doc) {
    "use strict";

    var bool,
        docElem = doc.documentElement,
        refNode = docElem.firstElementChild || docElem.firstChild,
        // fakeBody required for <FF4 when executed in <head>
        fakeBody = doc.createElement("body"),
        div = doc.createElement("div");

    div.id = "mq-test-1";
    div.style.cssText = "position:absolute;top:-100em";
    fakeBody.style.background = "none";
    fakeBody.appendChild(div);

    return function(q){
        div.innerHTML = "&shy;<style media=\"" + q + "\"> #mq-test-1 { width: 42px; }</style>";

        docElem.insertBefore(fakeBody, refNode);
        bool = div.offsetWidth === 42;
        docElem.removeChild(fakeBody);

        return {
           matches: bool,
           media: q
        };
    };
};

// readyState: loading --> interactive --> complete
//                      |               |
//                      |               |
//                      v               v
// Event:        DOMContentLoaded    onload
//
// iOS 4.3 and some Android 2.X.X have a non-typical "loaded" readyState,
// which is an acceptable readyState to start capturing on, because
// the data is fully loaded from the server at that state.
// For some IE (IE10 on Lumia 920 for example), interactive is not 
// indicative of the DOM being ready, therefore "complete" is the only acceptable
// readyState for IE10
// Credit to https://github.com/jquery/jquery/commit/0f553ed0ca0c50c5f66377e9f2c6314f822e8f25
// for the IE10 fix
Utils.domIsReady = function(doc) {
    var doc = doc || document;
    return doc.attachEvent ? doc.readyState === "complete" : doc.readyState !== "loading";
};

Utils.getPhysicalScreenSize = function(devicePixelRatio) {

    function multiplyByPixelRatio(sizes) {
        var dpr = devicePixelRatio || window.devicePixelRatio || 1;

        sizes.width = Math.round(sizes.width * dpr);
        sizes.height = Math.round(sizes.height * dpr);

        return sizes;
    }

    var iOS = navigator.userAgent.match(/ip(hone|od|ad)/i);
    var androidVersion = (navigator.userAgent.match(/android (\d)/i) || {})[1];

    var sizes = {
        width: window.outerWidth
      , height: window.outerHeight
    };

    // Old Android and BB10 use physical pixels in outerWidth/Height, which is what we need
    // New Android (4.0 and above) use CSS pixels, requiring devicePixelRatio multiplication
    // iOS lies about outerWidth/Height when zooming, but does expose CSS pixels in screen.width/height

    if (!iOS) {
        if (androidVersion > 3) return multiplyByPixelRatio(sizes);
        return sizes;
    }

    var isLandscape = window.orientation % 180;
    if (isLandscape) {
        sizes.height = screen.width;
        sizes.width = screen.height;
    } else {
        sizes.width = screen.width;
        sizes.height = screen.height;
    }

    return multiplyByPixelRatio(sizes);
};

Utils.waitForReady = function(doc, callback) {
    // Waits for `doc` to be ready, and then fires callback, passing
    // `doc`.

    // We may be in "loading" state by the time we get here, meaning we are
    // not ready to capture. Next step after "loading" is "interactive",
    // which is a valid state to start capturing on (except IE), and thus when ready
    // state changes once, we know we are good to start capturing.
    // Cannot rely on using DOMContentLoaded because this event prematurely fires
    // for some IE10s.
    var ready = false;
    
    var onReady = function() {
        if (!ready) {
            ready = true;
            iid && clearInterval(iid);
            callback(doc);
        }
    }

    // Backup with polling incase readystatechange doesn't fire
    // (happens with some Android 2.3 browsers)
    var iid = setInterval(function(){
        if (Utils.domIsReady(doc)) {
            onReady();
        }
    }, 100);

    doc.addEventListener("readystatechange", onReady, false);
};

return Utils;

}));

},{}],4:[function(require,module,exports){
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['mobifyjs/utils', 'mobifyjs/patchAnchorLinks'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('../bower_components/mobifyjs-utils/utils.js'), require('./patchAnchorLinks.js'));
    } else {
        // Browser globals (root is window)
        root.Capture = factory(root.Utils, root.patchAnchorLinks);
    }
}(this, function (Utils, patchAnchorLinks) {

// ##
// # Static Variables/Functions
// ##

// v6 tag backwards compatibility change
if (window.Mobify && 
    !window.Mobify.capturing &&
    document.getElementsByTagName("plaintext").length) 
{
            window.Mobify.capturing = true;
}

var openingScriptRe = /(<script[\s\S]*?>)/gi;

// Inline styles and scripts are disabled using a unknown type.
var tagDisablers = {
    style: ' media="mobify-media"',
    script: ' type="text/mobify-script"'
};

var tagEnablingRe = new RegExp(Utils.values(tagDisablers).join('|'), 'g');

// Map of all attributes we should disable (to prevent resources from downloading)
var disablingMap = {
    img:    ['src'],
    source: ['src'],
    iframe: ['src'],
    script: ['src', 'type'],
    link:   ['href'],
    style:  ['media'],
};

var affectedTagRe = new RegExp('<(' + Utils.keys(disablingMap).join('|') + ')([\\s\\S]*?)>', 'gi');
var attributeDisablingRes = {};
var attributesToEnable = {};

// Populate `attributesToEnable` and `attributeDisablingRes`.
for (var tagName in disablingMap) {
    if (!disablingMap.hasOwnProperty(tagName)) continue;
    var targetAttributes = disablingMap[tagName];

    targetAttributes.forEach(function(value) {
        attributesToEnable[value] = true;
    });

    // <space><attr>='...'|"..."
    attributeDisablingRes[tagName] = new RegExp(
        '\\s+((?:'
        + targetAttributes.join('|')
        + ")\\s*=\\s*(?:('|\")[\\s\\S]+?\\2))", 'gi');
}

/**
 * Returns the name of a node (in lowercase)
 */
function nodeName(node) {
    return node.nodeName.toLowerCase();
}

/**
 * Escape quotes
 */
function escapeQuote(s) {
    return s.replace('"', '&quot;');
}


/**
 * Helper method for looping through and grabbing strings of elements
 * in the captured DOM after plaintext insertion
 */
function extractHTMLStringFromElement(container) {
    if (!container) return '';
    return [].map.call(container.childNodes, function(el) {
        var tagName = nodeName(el);
        if (tagName == '#comment') return '<!--' + el.textContent + '-->';
        if (tagName == 'plaintext') return el.textContent;
        // Don't allow mobify related scripts to be added to the new document
        if (tagName == 'script' && ((/mobify/.test(el.src) || /mobify/i.test(el.textContent)))) {
            return '';
        }
        return el.outerHTML || el.nodeValue || Utils.outerHTML(el);
    }).join('');
}

// cached div used repeatedly to create new elements
var cachedDiv = document.createElement('div');

// ##
// # Constructor
// ##
var Capture = function(sourceDoc, prefix) {
    this.sourceDoc = sourceDoc;
    this.prefix = prefix || "x-";
    if (window.Mobify) window.Mobify.prefix = this.prefix;
};

/**
 * Initiate a buffered capture. `init` is an alias to `initCapture` for
 * backwards compatibility.
 */
Capture.init = Capture.initCapture = function(callback, doc, prefix) {
    var doc = doc || document;

    var createCapture = function(callback, doc, prefix) {
        var capture = new Capture(doc, prefix);
        var capturedStringFragments = Capture.createDocumentFragmentsStrings(capture.sourceDoc);
        Utils.extend(capture, capturedStringFragments);
        var capturedDOMFragments = capture.createDocumentFragments();
        Utils.extend(capture, capturedDOMFragments);
        callback(capture);
    }

    if (Utils.domIsReady(doc)) {
        createCapture(callback, doc, prefix);
    }
    // We may be in "loading" state by the time we get here, meaning we are
    // not ready to capture. Next step after "loading" is "interactive",
    // which is a valid state to start capturing on (except IE), and thus when ready
    // state changes once, we know we are good to start capturing.
    // Cannot rely on using DOMContentLoaded because this event prematurely fires
    // for some IE10s.
    else {
        var created = false;
        
        var create = function() {
            if (!created) {
                created = true;
                iid && clearInterval(iid);
                createCapture(callback, doc, prefix);
            }
        }
        // backup with polling incase readystatechange doesn't fire
        // (happens with some Android 2.3 browsers)
        var iid = setInterval(function(){
            if (Utils.domIsReady(doc)) {
                create();
            }
        }, 100);
        doc.addEventListener("readystatechange", create, false);

    }
};

/**
 * Removes closing tags from the end of an HTML string.
 */
Capture.removeClosingTagsAtEndOfString = function(html) {
    var match = html.match(/((<\/[^>]+>)+)$/);
    if (!match) return html;
    return html.substring(0, html.length - match[0].length);
}

Capture.removeTargetSelf = function(html) {
    return html.replace(/target=("_self"|\'_self\')/gi, '');
}

/**
 * Grab attributes from a string representation of an elements and clone them into dest element
 */
Capture.cloneAttributes = function(sourceString, dest) {
    var match = sourceString.match(/^<(\w+)([\s\S]*)$/i);
    cachedDiv.innerHTML = '<div' + match[2];
    [].forEach.call(cachedDiv.firstChild.attributes, function(attr) {
        try {
            dest.setAttribute(attr.nodeName, attr.nodeValue);
        } catch (e) {
            console.error("Error copying attributes while capturing: ", e);
        }
    });

    return dest;
};

/**
 * Returns a string with all external attributes disabled.
 * Includes special handling for resources referenced in scripts and inside
 * comments.
 * Not declared on the prototype so it can be used as a static method.
 */
Capture.disable = function(htmlStr, prefix) {
    var self = this;
    // Disables all attributes in disablingMap by prepending prefix
    var disableAttributes = (function(){
        return function(whole, tagName, tail) {
            lowercaseTagName = tagName.toLowerCase();
            return result = '<' + lowercaseTagName + (tagDisablers[lowercaseTagName] || '')
                + tail.replace(attributeDisablingRes[lowercaseTagName], ' ' + prefix + '$1') + '>';
        }
    })();

    var splitRe = /(<!--[\s\S]*?-->)|(?=<\/script)/i;
    var tokens = htmlStr.split(splitRe);
    var ret = tokens.map(function(fragment) {
                var parsed

                // Fragment may be empty or just a comment, no need to escape those.
                if (!fragment) return '';
                if (/^<!--/.test(fragment)) return fragment;

                // Disable before and the <script> itself.
                // parsed = [before, <script>, script contents]
                parsed = fragment.split(openingScriptRe);
                parsed[0] = parsed[0].replace(affectedTagRe, disableAttributes);
                if (parsed[1]) parsed[1] = parsed[1].replace(affectedTagRe, disableAttributes);
                return parsed;
            });

    return [].concat.apply([], ret).join('');
};

/**
 * Returns a string with all disabled external attributes enabled.
 * Not declared on the prototype so it can be used as a static method.
 */
Capture.enable = function(htmlStr, prefix) {
    var attributeEnablingRe = new RegExp('\\s' + prefix + '(' + Utils.keys(attributesToEnable).join('|') + ')', 'gi');
    return htmlStr.replace(attributeEnablingRe, ' $1').replace(tagEnablingRe, '');
};

/**
 * Return a string for the opening tag of DOMElement `element`.
 */
Capture.openTag = function(element) {
    if (!element) return '';
    if (element.length) element = element[0];

    var stringBuffer = [];

    [].forEach.call(element.attributes, function(attr) {
        stringBuffer.push(' ', attr.name, '="', escapeQuote(attr.value), '"');
    })

    return '<' + nodeName(element) + stringBuffer.join('') + '>';
};

/**
 * Set the content of an element with html from a string
 */
Capture.setElementContentFromString = function(el, htmlString) {
    for (cachedDiv.innerHTML = htmlString; cachedDiv.firstChild; el.appendChild(cachedDiv.firstChild));
};

/**
 * Returns an object containing the state of the original page. Caches the object
 * in `extractedHTML` for later use.
 */
 Capture.createDocumentFragmentsStrings = function(doc) {
    var headEl = doc.getElementsByTagName('head')[0] || doc.createElement('head');
    var bodyEl = doc.getElementsByTagName('body')[0] || doc.createElement('body');
    var htmlEl = doc.getElementsByTagName('html')[0];

    var captured = {
        doctype: Utils.getDoctype(doc),
        htmlOpenTag: Capture.openTag(htmlEl),
        headOpenTag: Capture.openTag(headEl),
        bodyOpenTag: Capture.openTag(bodyEl),
        headContent: extractHTMLStringFromElement(headEl),
        bodyContent: extractHTMLStringFromElement(bodyEl)
    };

    /**
     * RR: I assume that Mobify escaping tag is placed in <head>. If so, the <plaintext>
     * it emits would capture the </head><body> boundary, as well as closing </body></html>
     * Therefore, bodyContent will have these tags, and they do not need to be added to .all()
     */
    captured.all = function(inject) {
        return this.doctype + this.htmlOpenTag + this.headOpenTag + (inject || '') + this.headContent + this.bodyOpenTag + this.bodyContent;
    };

    // During capturing, we will usually end up hiding our </head>/<body ... > boundary
    // within <plaintext> capturing element. To construct source DOM, we need to rejoin
    // head and body content, iterate through it to find head/body boundary and expose
    // opening <body ... > tag as a string.

    // Consume comments without grouping to avoid catching
    // <body> inside a comment, common with IE conditional comments.
    // (using a "new RegExp" here because in Android 2.3 when you use a global
    // match using a RegExp literal, the state is incorrectly cached).
    var bodySnatcher = new RegExp('<!--(?:[\\s\\S]*?)-->|(<\\/head\\s*>|<body[\\s\\S]*$)', 'gi');

    //Fallback for absence of </head> and <body>
    var rawHTML = captured.bodyContent = captured.headContent + captured.bodyContent;
    captured.headContent = '';

    // Search rawHTML for the head/body split.
    for (var match; match = bodySnatcher.exec(rawHTML); match) {
        // <!-- comment --> . Skip it.
        if (!match[1]) continue;

        // Grab the contents of head
        captured.headContent = rawHTML.slice(0, match.index);
        // Parse the head content
        var parsedHeadTag = (new RegExp('^[\\s\\S]*(<head(?:[^>\'"]*|\'[^\']*?\'|"[^"]*?")*>)([\\s\\S]*)$')).exec(captured.headContent);
        if (parsedHeadTag) {
            // if headContent contains an open head, then we know the tag was placed
            // outside of the body
            captured.headOpenTag = parsedHeadTag[1];
            captured.headContent = parsedHeadTag[2];
        }

        // If there is a closing head tag
        if (match[1][1] == '/') {
            // Hit </head. Gather <head> innerHTML. Also, take trailing content,
            // just in case <body ... > is missing or malformed
            captured.bodyContent = rawHTML.slice(match.index + match[1].length);
        } else {
            // Hit <body. Gather <body> innerHTML.
            // If we were missing a </head> before, now we can pick up everything before <body
            captured.bodyContent = match[0];

            // Find the end of <body ... >
            var parseBodyTag = /^((?:[^>'"]*|'[^']*?'|"[^"]*?")*>)([\s\S]*)$/.exec(captured.bodyContent);

            // Will skip this if <body was malformed (e.g. no closing > )
            if (parseBodyTag) {
                // Normal termination. Both </head> and <body> were recognized and split out
                captured.bodyOpenTag = parseBodyTag[1];
                captured.bodyContent = parseBodyTag[2];
            }
            break;
        }
    }
    return captured;
};

Capture.isIOS8_0 = function() {
    var IOS8_REGEX = /ip(hone|od|ad).*Version\/8.0/i;

    return IOS8_REGEX.test(window.navigator.userAgent);
};

/**
 * This is a feature detection function to determine if you
 * can construct body using innerHTML. In iOS8, setting
 * innerHTML on body seems to break if you have forms.
 * If you have forms in the page which are siblings,
 * the second sibling ends up becoming a child element
 * of the first sibling.
 */
Capture.isSetBodyInnerHTMLBroken = function(){
    var doc = document.implementation.createHTMLDocument("");
    var bodyEl = doc.documentElement.lastChild;
    if (!bodyEl) {
        return false;
    }
    bodyEl.innerHTML = '<form></form><form></form>';
    if (bodyEl.childNodes && bodyEl.childNodes.length === 1) {
        return true;
    }
    return false;
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
Capture.ios8_0ScrollFix = function(doc, callback) {
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

/**
 * Grab the captured document and render it
 */
Capture.prototype.restore = function(inject) {
    var self = this;

    Utils.waitForReady(document, function() {
        self.render(self.all(inject));
    });
};

/**
 * Grab fragment strings and construct DOM fragments
 * returns htmlEl, headEl, bodyEl, doc
 */
Capture.prototype.createDocumentFragments = function() {
    var docFrags = {};
    var doc = docFrags.capturedDoc = document.implementation.createHTMLDocument("");
    var htmlEl = docFrags.htmlEl = doc.documentElement;
    var headEl = docFrags.headEl = htmlEl.firstChild;
    var bodyEl = docFrags.bodyEl = htmlEl.lastChild;

    // Reconstruct html, body, and head with the same attributes as the original document
    Capture.cloneAttributes(this.htmlOpenTag, htmlEl);
    Capture.cloneAttributes(this.headOpenTag, headEl);
    Capture.cloneAttributes(this.bodyOpenTag, bodyEl);

    var disabledBodyContent = Capture.disable(this.bodyContent, this.prefix);
    // Set innerHTML on body (if the browser is capable of doing so).
    // If not, set innerHTML on a div and copy children elements into body.
    if (!Capture.isSetBodyInnerHTMLBroken()) {
        // Set innerHTML of new source DOM body
        bodyEl.innerHTML = disabledBodyContent;
    } else {
        Capture.setElementContentFromString(bodyEl, disabledBodyContent);
    }

    // In Safari 4/5 and iOS 4.3, there are certain scenarios where elements
    // in the body (ex "meta" in "noscripts" tags) get moved into the head,
    // which can cause issues with certain websites (for example, if you have
    // a meta refresh tag inside of a noscript tag)
    var heads = doc.querySelectorAll('head');
    if (heads.length > 1) {
        while (heads[1].hasChildNodes()) {
            heads[1].removeChild(heads[1].lastChild);
        }
    }

    var disabledHeadContent = Capture.disable(this.headContent, this.prefix);
    // On FF4, iOS 4.3, and potentially other browsers, you cannot modify <head>
    // using innerHTML. In that case, do a manual copy of each element
    try {
        headEl.innerHTML = disabledHeadContent;
    } catch (e) {
        var title = headEl.getElementsByTagName('title')[0];
        title && headEl.removeChild(title);
        Capture.setElementContentFromString(headEl, disabledHeadContent);
    }

    return docFrags;
};

/**
 * Returns an HTML representation of the captured DOM with resources enabled.
 * (escapedHTMLString remains for backwards compatibility)
 */
Capture.prototype.enabledHTMLString = Capture.prototype.escapedHTMLString = function() {
    var doc = this.capturedDoc;
    var html = Capture.enable(Utils.outerHTML(doc.documentElement), this.prefix);
    var htmlWithDoctype = this.doctype + html;
    return htmlWithDoctype;
};

/**
 * Rewrite the document with a new html string
 */
Capture.prototype.render = function(htmlString) {
    var enabledHTMLString;
    if (!htmlString) {
        enabledHTMLString = this.enabledHTMLString();
    } else {
        enabledHTMLString = Capture.enable(htmlString, this.prefix);
    }

    var doc = this.sourceDoc;

    // Set capturing state to false so that the user main code knows how to execute
    if (window.Mobify) window.Mobify.capturing = false;

    var write = function() {
        // Asynchronously render the new document
        setTimeout(function(){
            doc.open("text/html", "replace");
            doc.write(enabledHTMLString);
            doc.close();
        });
    };
    
    if (Capture.isIOS8_0()) {
        Capture.ios8_0ScrollFix(document, write);
    } else {
        write();
    }
};

/**
 * Get the captured document
 */
Capture.prototype.getCapturedDoc = function(options) {
    return this.capturedDoc;
};

Capture.getMobifyLibrary = function(doc) {
    var doc = doc || document;
    var mobifyjsScript = doc.getElementById("mobify-js");

    // v6 tag backwards compatibility change
    if (!mobifyjsScript) {
        mobifyjsScript = doc.getElementsByTagName("script")[0];
        mobifyjsScript.id = "mobify-js";
        mobifyjsScript.setAttribute("class", "mobify");
    }

    return mobifyjsScript;
};

/**
 * Grabs the postload function/src/script if it exists
 */
Capture.getPostload = function(doc) {
    var doc = doc || document;
    var postloadScript = undefined;

    // mainExecutable is used for backwards compatibility purposes
    var tagOptions = window.Mobify.Tag && window.Mobify.Tag.options && window.Mobify.Tag.getOptions(Mobify.Tag.options) || {};
    var postload = (tagOptions.post && tagOptions.post.toString()) || window.Mobify.mainExecutable;
    if (postload) {
        // Checks for main executable string on Mobify object and creates a script
        // out of it
        postloadScript = document.createElement('script');
        postloadScript.innerHTML = "var postload = " + postload + "; postload();";
        postloadScript.id = 'postload';
        postloadScript.setAttribute("class", "mobify");
    } else {
        // Older tags used to insert the main executable by themselves. 
        postloadScript = doc.getElementById("main-executable");
    }
    return postloadScript;
}

/**
 * Insert Mobify scripts back into the captured doc
 * in order for the library to work post-document.write
 */
Capture.insertMobifyScripts = function(sourceDoc, destDoc) {
    // After document.open(), all objects will be removed.
    // To provide our library functionality afterwards, we
    // must re-inject the script.
    var mobifyjsScript = Capture.getMobifyLibrary(sourceDoc);

    var head = destDoc.head || destDoc.getElementsByTagName('head')[0];
    if (!head) {
        return;
    }

    // If main script exists, re-inject it.
    var mainScript = Capture.getPostload(sourceDoc);
    if (mainScript) {
        // Since you can't move nodes from one document to another,
        // we must clone it first using importNode:
        // https://developer.mozilla.org/en-US/docs/DOM/document.importNode
        var mainClone = destDoc.importNode(mainScript, false);
        if (!mainScript.src) {
            mainClone.innerHTML = mainScript.innerHTML;
        }
        head.insertBefore(mainClone, head.firstChild);
    }
    // reinject mobify.js file
    var mobifyjsClone = destDoc.importNode(mobifyjsScript, false);
    head.insertBefore(mobifyjsClone, head.firstChild);
};

/**
 * Render the captured document
 */
Capture.prototype.renderCapturedDoc = function(options) {
    // Insert the mobify scripts back into the captured doc
    Capture.insertMobifyScripts(this.sourceDoc, this.capturedDoc);

    // Inject timing point (because of blowing away objects on document.write)
    // if it exists
    if (window.Mobify && window.Mobify.points) {
        var body = this.bodyEl;
        var date = this.capturedDoc.createElement("div");
        date.id = "mobify-point";
        date.setAttribute("style", "display: none;")
        date.innerHTML = window.Mobify.points[0];
        body.insertBefore(date, body.firstChild);
    }

    this.render();
};

/**
 * patchAnchorLinks
 *
 * Anchor Links `<a href="#foo">Link</a>` are broken on Firefox.
 * We provide a function that patches, but it does break
 * actually changing the URL to show "#foo".
 * 
 */
Capture.patchAnchorLinks = patchAnchorLinks;

return Capture;

}));

},{"../bower_components/mobifyjs-utils/utils.js":3,"./patchAnchorLinks.js":8}],5:[function(require,module,exports){
/**
 * cssOptimize - Client code to a css optimization service
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['mobifyjs/utils'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        var Utils = require('../bower_components/mobifyjs-utils/utils.js');
        module.exports = factory(Utils);
    } else {
        // Browser globals (root is window)
        root.CssOptimize = factory(root.Utils);
    }
}(this, function (Utils) {

var CssOptimize = window.cssOptimize = {};

/**
 * Takes an original, absolute url of a stylesheet, returns a url for that
 * stylesheet going through the css service.
 */

CssOptimize.getCssUrl = function(url, options) {
    var opts = Utils.extend({}, defaults, options);
    var bits = [opts.protoAndHost];

    if (opts.projectName) {
        bits.push('project-' + opts.projectName);
    }

    bits.push(opts.endpoint);
    bits.push(url);

    return bits.join('/');
};

/**
 * Rewrite the href of a stylesheet referencing `<link>` element to go through 
 * our service.
 */
CssOptimize._rewriteHref = function(element, options) {
    var attributeVal = element.getAttribute(options.targetAttribute);
    var url;
    if (attributeVal) {
        url = Utils.absolutify(attributeVal);
        if (Utils.httpUrl(url)) {
            element.setAttribute('data-orig-href', attributeVal);
            element.setAttribute(options.targetAttribute,
                                 CssOptimize.getCssUrl(url, options));
            if (options.onerror) {
                element.setAttribute('onerror', options.onerror);
            }
        }
    }
};

/**
 * Takes an array-like object of `<link>` elements
 */
CssOptimize.optimize = function(elements, options) {
    var opts = Utils.extend({}, defaults, options);
    var element;

    for(var i = 0, len = elements.length; i < len; i++) {
        element = elements[i];
        if (element.nodeName === 'LINK' &&
            element.getAttribute('rel') === 'stylesheet' &&
            element.getAttribute(opts.targetAttribute) &&
            !element.hasAttribute('mobify-optimized')) {
            element.setAttribute('mobify-optimized', '');
            CssOptimize._rewriteHref(element, opts);
        }
    }
};

/**
 * An 'error' event handler designed to be set using an "onerror" attribute that
 * will set the target elements "href" attribute to the value of its 
 * "data-orig-href" attribute, if one exists.
 */
var restoreOriginalHref = CssOptimize.restoreOriginalHref = function(event) {
    var origHref;
    event.target.removeAttribute('onerror'); //remove error handler
    if(origHref = event.target.getAttribute('data-orig-href')) {
        event.target.setAttribute('href', origHref);
    }
};

var defaults = CssOptimize._defaults = {
    protoAndHost: '//jazzcat.mobify.com',
    endpoint: 'cssoptimizer',
    projectName: 'oss-' + location.hostname.replace(/[^\w]/g, '-'),
    targetAttribute: 'x-href',
    onerror: 'Mobify.CssOptimize.restoreOriginalHref(event);'
};

return CssOptimize;

}));

},{"../bower_components/mobifyjs-utils/utils.js":3}],6:[function(require,module,exports){
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['mobifyjs/utils', 'mobifyjs/capture'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('../../bower_components/mobifyjs-utils/utils.js'),
                                 require('../capture.js'));
    }
}(this, function (Utils, Capture) {

var capturing = window.Mobify && window.Mobify.capturing || false;

if (capturing) {
    // Override renderCapturedDoc to disable img elements in picture elements
    var oldRenderCapturedDoc = Capture.prototype.renderCapturedDoc;
    Capture.prototype.renderCapturedDoc = function(options) {
        // Change attribute of any img element inside a picture element
        // so it does not load post-flood
        var imgsInPicture = this.capturedDoc.querySelectorAll('picture img');
        for (var i = 0, len = imgsInPicture.length; i < len; i++) {
            var disableImg = imgsInPicture[i];
            var srcAttr = window.Mobify && window.Mobify.prefix + 'src';
            disableImg.setAttribute('data-orig-src', disableImg.getAttribute(srcAttr));
            disableImg.removeAttribute(srcAttr);
        }
        oldRenderCapturedDoc.apply(this, arguments);
    }

    return;
}

window.matchMedia = window.matchMedia || Utils.matchMedia(document);

/* https://github.com/Wilto/picturefill-proposal */
/*! Picturefill - Author: Scott Jehl, 2012 | License: MIT/GPLv2 */ 
/*
    Picturefill: A polyfill for proposed behavior of the picture element, which does not yet exist, but should. :)
    * Notes: 
        * For active discussion of the picture element, see http://www.w3.org/community/respimg/
        * While this code does work, it is intended to be used only for example purposes until either:
            A) A W3C Candidate Recommendation for <picture> is released
            B) A major browser implements <picture>
*/ 
(function( w ){
    // Enable strict mode
    "use strict";

    // User preference for HD content when available
    var prefHD = false || w.localStorage && w.localStorage[ "picturefill-prefHD" ] === "true",
        hasHD;

    // Test if `<picture>` is supported natively, if so, exit - no polyfill needed.
    if ( !!( w.document.createElement( "picture" ) && w.document.createElement( "source" ) && w.HTMLPictureElement ) ){
        return;
    }

    w.picturefill = function() {
        var ps = w.document.getElementsByTagName( "picture" );

        // Loop the pictures
        for( var i = 0, il = ps.length; i < il; i++ ){
            var sources = ps[ i ].getElementsByTagName( "source" ),
                picImg = null,
                matches = [];

            // If no sources are found, they're likely erased from the DOM. Try finding them inside comments.
            if( !sources.length ){
                var picText =  ps[ i ].innerHTML,
                    frag = w.document.createElement( "div" ),
                    // For IE9, convert the source elements to divs
                    srcs = picText.replace( /(<)source([^>]+>)/gmi, "$1div$2" ).match( /<div[^>]+>/gmi );

                frag.innerHTML = srcs.join( "" );
                sources = frag.getElementsByTagName( "div" );
            }

            // See which sources match
            for( var j = 0, jl = sources.length; j < jl; j++ ){
                var media = sources[ j ].getAttribute( "media" );
                // if there's no media specified, OR w.matchMedia is supported 
                if( !media || ( w.matchMedia && w.matchMedia( media ).matches ) ){
                    matches.push( sources[ j ] );
                }
            }

            // Find any existing img element in the picture element
            picImg = ps[ i ].getElementsByTagName( "img" )[ 0 ];

            if( matches.length ){
                // Grab the most appropriate (last) match.
                var match = matches.pop(),
                    srcset = match.getAttribute( "srcset" );

                if( !picImg ){
                    picImg = w.document.createElement( "img" );
                    picImg.alt = ps[ i ].getAttribute( "alt" );
                    ps[ i ].appendChild( picImg );
                }

                if( srcset ) {
                        var screenRes = ( prefHD && w.devicePixelRatio ) || 1, // Is it worth looping through reasonable matchMedia values here?
                            sources = srcset.split(","); // Split comma-separated `srcset` sources into an array.

                        hasHD = w.devicePixelRatio > 1;

                        for( var res = sources.length, r = res - 1; r >= 0; r-- ) { // Loop through each source/resolution in `srcset`.
                            var source = sources[ r ].replace(/^\s*/, '').replace(/\s*$/, '').split(" "), // Remove any leading whitespace, then split on spaces.
                                resMatch = parseFloat( source[1], 10 ); // Parse out the resolution for each source in `srcset`.

                            if( screenRes >= resMatch ) {
                                if( picImg.getAttribute( "src" ) !== source[0] ) {
                                    var newImg = document.createElement("img");

                                    newImg.src = source[0];
                                    // When the image is loaded, set a width equal to that of the original’s intrinsic width divided by the screen resolution:
                                    newImg.onload = function() {
                                        // Clone the original image into memory so the width is unaffected by page styles:
                                        this.width = ( this.cloneNode( true ).width / resMatch );
                                    }
                                    picImg.parentNode.replaceChild( newImg, picImg );
                                }
                                break; // We’ve matched, so bail out of the loop here.
                            }
                        }
                } else {
                    // No `srcset` in play, so just use the `src` value:
                    picImg.src = match.getAttribute( "src" );
                }
            }
        }
    };

    // Run on resize and domready (w.load as a fallback)
    if( w.addEventListener ){
        w.addEventListener( "resize", w.picturefill, false );
        w.addEventListener( "DOMContentLoaded", function(){
            w.picturefill();
            // Run once only
            w.removeEventListener( "load", w.picturefill, false );
        }, false );
        w.addEventListener( "load", w.picturefill, false );
    }
    else if( w.attachEvent ){
        w.attachEvent( "onload", w.picturefill );
    }
})( this );

return;

}));

},{"../../bower_components/mobifyjs-utils/utils.js":3,"../capture.js":4}],7:[function(require,module,exports){
(function (root, factory) {
    if (typeof require === 'function' && typeof define === 'function' &&
        define.amd) {
        // AMD. Register as an anonymous module.
        require(["mobifyjs/utils", "mobifyjs/capture", "mobifyjs/resizeImages",
               "mobifyjs/jazzcat", "mobifyjs/unblockify",
               "mobifyjs/cssOptimize", "mobifyjs/external/picturefill"],
               factory,
               undefined, true);
               // relPath, forceSync
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        var Utils = require('../bower_components/mobifyjs-utils/utils');
        var Capture = require('./capture');
        var ResizeImages = require('../bower_components/imageresize-client/resizeImages');
        var Jazzcat = require('../bower_components/jazzcat-client/jazzcat');
        var CssOptimize = require('./cssOptimize');
        var Unblockify = require('./unblockify');
        require('./external/picturefill');

        module.exports = factory(Utils, Capture, ResizeImages, Jazzcat,
                                 Unblockify, CssOptimize);
    }
}(this, function(Utils, Capture, ResizeImages, Jazzcat, Unblockify, CssOptimize) {
    var Mobify = window.Mobify = window.Mobify || {};
    Mobify.Utils = Utils;
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;
    Mobify.Jazzcat = Jazzcat;
    Mobify.CssOptimize = CssOptimize;
    Mobify.Unblockify = Unblockify;
    Mobify.api = "2.0"; // v6 tag backwards compatibility change
    return Mobify;

}));

},{"../bower_components/imageresize-client/resizeImages":1,"../bower_components/jazzcat-client/jazzcat":2,"../bower_components/mobifyjs-utils/utils":3,"./capture":4,"./cssOptimize":5,"./external/picturefill":6,"./unblockify":9}],8:[function(require,module,exports){
// Fixes anchor links (on FF)
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(["mobifyjs/utils"], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        var Utils = require('../bower_components/mobifyjs-utils/utils.js');
        module.exports = factory(Utils);
    } else {
        // Browser globals (root is window)
        root.Utils = factory(root.Utils);
    }
}(this, function (Utils) {
    var exports = {};

    var isOldFirefox = function(ua) {
        ua = ua || window.navigator.userAgent;
        var match = /(firefox|fennec)[\/\s](\d+)/i.exec(ua);
        if (match) {
            var version = +match[2];
            if (version >= 29) {
                return false;
            }
            return true;
        }

        return false;
    };

    var _patchAnchorLinks = function(doc) {
        // Anchor links in FF, after we do `document.open` cause a page
        // navigation (a refresh) instead of just scrolling the
        // element in to view.
        //
        // So, we prevent the default action on the element, and
        // then manually scroll it in to view (unless some else already
        // called prevent default).

        var body = doc.body;

        if (!(body && body.addEventListener)) {
            // Body is not there or we can't bind as expected.
            return;
        }

        var _handler = function(e) {
            // Handler for all clicks on the page, but only triggers
            // on proper anchor links.

            var target = e.target;

            var matches = function(el) {
                return (el.nodeName == "A") && (/^#/.test(el.getAttribute('href')));
            };

            if (!matches(target)) {
                return;
            }
            
            // Newer browsers support `e.defaultPrevented`. FF 4.0 supports `e.getPreventDefault()`
            var defaultPrevented = (typeof e.defaultPrevented !== "undefined") ?
                e.defaultPrevented :
                e.getPreventDefault && e.getPreventDefault();

            if (!defaultPrevented) {
                // Prevent the default action, which would cause a
                // page refresh.
                e.preventDefault();

                // But pretend that we didn't call it.
                e.defaultPrevented = false;

                // We have to wait and see if anyone else calls
                // `preventDefault`. If they do, we don't scroll.
                var scroll = true;

                // Override the `preventDefault` to stop  us from scrolling.
                e.preventDefault = function() {
                    e.defaultPrevented = true;
                    scroll = false;
                };

                // If no other events call `preventDefault` we manually
                // scroll to the element in question.
                setTimeout(function() {
                    if (scroll) {
                        _scrollToAnchor(target.getAttribute('href'));
                    }
                }, 50);
            }
        };


        var _scrollToAnchor = function(anchor) {
            // Scrolls to the element, if any, that matches
            // the given anchor link (eg, "#foo").

            var anchorRe = /^#([^\s]*)/;
            var match = anchor.match(anchorRe);
            var target;
            
            // Find the target, if any
            if (match && match[1] === "") {
                target = doc.body;
            } else if (match && match[1]) {
                target = doc.getElementById(match[1]);
            }

            // Scroll to it, if it exists
            if (target) {
                target.scrollIntoView && target.scrollIntoView();
            }
        };

        // We have to get the event through bubbling, otherwise
        // events cancelled by the return value of an onclick
        // handler are not correctly handled.
        body.addEventListener('click', _handler, false);
    };

    var patchAnchorLinks = function() {
        if (!isOldFirefox()) {
            return;
        }

        Utils.waitForReady(document, _patchAnchorLinks);
    };

    patchAnchorLinks._isOldFirefox = isOldFirefox;


    return patchAnchorLinks;
}));

},{"../bower_components/mobifyjs-utils/utils.js":3}],9:[function(require,module,exports){
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['mobifyjs/utils', 'mobifyjs/capture'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        var Utils = require('../bower_components/mobifyjs-utils/utils.js');
        var Capture = require('./capture.js');
        module.exports = factory(Utils, Capture);
    } else {
        // Browser globals (root is window)
        root.Unblockify = factory(root.Utils, root.Capture);
    }
}(this, function (Utils, Capture) {

var Unblockify = {}

// Moves all scripts to the end of body by overriding insertMobifyScripts
Unblockify.moveScripts = function(scripts, doc) {
    // Remove elements from the document
    Utils.removeElements(scripts, doc);

    for (var i=0,ii=scripts.length; i<ii; i++) {
        var script = scripts[i];
        doc.body.appendChild(script);
    }
};


Unblockify.unblock = function(scripts) {
    // Grab reference to old insertMobifyScripts method
    var oldInsert = Capture.prototype.insertMobifyScripts;

    // Override insertMobifyScripts to also move the scripts
    // to the end of the body
    Capture.prototype.insertMobifyScripts = function() {
        oldInsert.call(this);

        var doc = this.capturedDoc;
        Unblockify.moveScripts(scripts, doc);
    };
};

return Unblockify;

}));

},{"../bower_components/mobifyjs-utils/utils.js":3,"./capture.js":4}]},{},[7])