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
 * Scripts that should use the client must be passed to `Jazzcat.combineScripts`
 * during the capturing phase. During execution, uncached scripts are loaded
 * into the cache using a bootloader request to Jazzcat. Scripts are then
 * executed directly from the cache.
 */
define(["utils", "capture"], function(Utils, Capture) {
    /**
     * An HTTP 1.1 compliant localStorage backed cache.
     */
    var cache = {};

    var localStorageKey = 'Mobify-Combo-Cache-v1.0';

    var httpCacheOptions = {};

    /**
     * Reset the cache, optionally to `val`. Useful for testing.
     */
    var reset = function(val) {
        cache = val || {};
    };

    /**
     * Returns value of `key` if it is in the cache.
     */
    var get = function(key, touch) {
        // Ignore anchors.
        var resource = cache[key.split('#')[0]];
        if (resource && touch) {
            resource.lastUsed = Date.now();
        }
        return resource;
    };

    /**
     * Set `key` to `val` in the cache.
     */
    var set = function(key, val) {
        cache[key] = val;
    };

    /**
     * Load the cache into memory, skipping stale resources.
     */
    var load = function(options) {
        var data = localStorage.getItem(localStorageKey)
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
            if (data.hasOwnProperty(key) && !isStale(data[key], staleOptions)) {
                set(key, data[key]);
            }
        }
    };

    /**
     * Save the in-memory cache to localStorage. If the localStorage is full,
     * use LRU to drop resources until it will fit on disk, or give up after 10
     * attempts.
     */
    var save = function(callback) {
        var resources = {};
        var resource;
        var attempts = 10;
        var key;

        for (key in cache) {
            if (cache.hasOwnProperty(key)) {
                resources[key] = cache[key];
            }
        }

        // Serialize the cache for storage. If the serialized data won't fit,
        // evict an item and try again. Use `setTimeout` to ensure the UI stays
        // responsive even if a number of resources are evicted.
        (function persist() {
            var store = function() {
                var serialized;
                // End of time.
                var lruTime = 9007199254740991;
                var lruKey;
                try {
                    serialized = JSON.stringify(resources);
                } catch(e) {
                    return callback && callback(e);
                }

                try {
                    localStorage.setItem(localStorageKey, serialized);
                // The serialized data won't fix. Remove the least recently used
                // resource and try again.
                } catch(e) {
                    if (!--attempts) {
                        return callback && callback(e);
                    }
                    // Find the least recently used resource.
                    for (key in resources) {
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

                callback && callback();
            };

            setTimeout(store, 0);
        })();
    };

    // Regular expressions for cache-control directives.
    // See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9
    var ccDirectives = /^\s*(public|private|no-cache|no-store)\s*$/;
    var ccMaxAge = /^\s*(max-age)\s*=\s*(\d+)\s*$/;

    /**
     * Returns a parsed HTTP 1.1 Cache-Control directive from a string `directives`.
     */
    var ccParse = function(directives) {
        var obj = {};
        var match;

        directives.split(',').forEach(function(directive) {
            if (match = ccDirectives.exec(directive)) {
                obj[match[1]] = true;
            } else if (match = ccMaxAge.exec(directive)) {
                obj[match[1]] = parseInt(match[2]);
            }
        });

        return obj;
    };

    /**
     * Returns `false` if a response is "fresh" by HTTP/1.1 caching rules or 
     * less than ten minutes old. Treats invalid headers as stale.
     */
    var isStale = function(resource, options) {
        var headers = resource.headers || {};
        var cacheControl = headers['cache-control'];
        var now = Date.now();
        var date = Date.parse(headers['date']);
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
            cacheControl = ccParse(cacheControl);

            if ((cacheControl['max-age']) &&
                (!cacheControl['private']) &&
                (!cacheControl['no-store']) &&
                (!cacheControl['no-cache'])) {
                // Convert the max-age directive to ms.
                return now > (date + (cacheControl['max-age'] * 1000));
            }
        }

        // If `expires` is present, we are stale if we are older.
        if (date = Date.parse(headers.expires)) {
            return now > date;
        }

        // Otherwise, we are stale.
        return true;
    };

    var httpCache = {
        get: get,
        set: set,
        load: load,
        save: save,
        reset: reset,
        cache: cache,
        utils: {isStale: isStale},
        options: httpCacheOptions
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
     *   <script>true,"body",Jazzcat.combo.exec("http://code.jquery.com/jquery.js")</script>
     *   <script>$(function() { alert("helo joe"); })</script>
     *
     * Note that this only the first part of the Jazzcat transformation. The
     * bootloader script is inserted by the overriden `Capture.enabled` function.
     * 
     * Takes an option argument, `options`, an object whose properties define 
     * optiosn that alter jazzcat's javascript loading, caching and execution 
     * behaviour. Right now the options are:
     *
     * - `cacheOverrideTime` :  An integer value greater than 10 that will 
     *                          override the freshness implied by the HTTP 
     *                          caching headers set on the reource.
     */

    Jazzcat.combineScripts = function(scripts, doc, options) {
        if (options && options.cacheOverrideTime !== undefined) {
            Utils.extend(httpCache.options,
              {overrideTime: options.cacheOverrideTime});
        }
        // Fastfail if there are no scripts or if required features are missing.
        if (!scripts.length || Jazzcat.isIncompatibleBrowser()) {
            return scripts;
        }

        var script;
        var url;
        var i = 0;

        options = Utils.extend({}, defaults, options || {});

        httpCache.load(httpCache.options);

        while (script = scripts[i++]) {
            url = script.getAttribute(options.attribute);
            if (!url) continue;
            url = Utils.absolutify(url);
            if (!Utils.httpUrl(url)) continue;

            script.removeAttribute(options.attribute);

            // Rewriting script to grab contents from localstorage
            // ex. <script>true,"body",Jazzcat.combo.exec("http://code.jquery.com/jquery.js")</script>
                               
                                // true or false depending if the script is cached
            script.innerHTML = !!httpCache.get(url) +
                                ",\"" +
                                // head or body
                                (script.parentNode === doc.head ? "head" : "body") +
                                "\"," +
                                // Jazzcat callback to be executed when new document is written
                                options.execCallback +
                                "('" + url + "');";
        }

        return scripts;
    };

    var defaults = Jazzcat.combineScripts.defaults = {
        selector: 'script',
        attribute: 'x-src',
        base: '//jazzcat.mobify.com',
        endpoint: 'jsonp',
        execCallback: 'Jazzcat.combo.exec',
        loadCallback: 'Jazzcat.combo.load',
        projectName: ''
    };

    Jazzcat.combo = {
        /**
         * Execute the script at `url` using `document.write`. If the scripts
         * can't be retrieved from the cache, load it using an external script.
         */
        exec: function(url) {
            var resource = httpCache.get(url, true);
            var out;

            if (!resource) {
                out = 'src="' + url + '">';
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
                out += '>' + resource.body.replace(/(<\/scr)(ipt\s*>)/ig, '$1\\$2');
            }

            // `document.write` is used to ensure scripts are executed in order,
            // as opposed to "as fast as possible"
            // http://hsivonen.iki.fi/script-execution/
            // http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
            // This call seems to do nothing in Opera 11/12
            Jazzcat.write.call(document, '<script ' + out + '<\/script>');
        },

        /**
         * Load the cache and populate it with the results of the Jazzcat
         * response `resources`.
         */
        load: function(resources) {
            var resource;
            var i = 0;
            var save = false;

            // All the resources are already in the cache.
            if (!resources) {
                return;
            }

            while (resource = resources[i++]) {
                if (resource.status == 'ready') {
                    save = true;
                    httpCache.set(encodeURI(resource.url), resource);
                }
            }

            if (save) {
                httpCache.save();
            }
        }
    };

    /**
     * Private helper that returns a script node that when run, loads the 
     * httpCache from localStorage.
     */
    var _getLoadFromCacheScript = function() {
        var loadFromCacheScript = document.createElement('script');
        loadFromCacheScript.innerHTML = (httpCache.options.overrideTime ?
          "Jazzcat.httpCache.load(" + JSON.stringify(httpCache.options) + ");" :
          "Jazzcat.httpCache.load();" );

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
    Jazzcat.getLoaderScripts = function(urls, jsonpCallback, cacheLoaded) {
        var loadFromCacheScript;
        var loadFromServiceScript;
        var result = [];
        if (!cacheLoaded) {
            loadFromCacheScript = _getLoadFromCacheScript();
            result.push(loadFromCacheScript);
        }
        if (urls && urls.length) {
            loadFromServiceScript = document.createElement('script');
            loadFromServiceScript.src = Jazzcat.getURL(urls, jsonpCallback);
            result.push(loadFromServiceScript);
        }
        return result;
    };

    /**
     * Returns a URL suitable for loading `urls` from Jazzcat, calling the
     * function `jsonpCallback` on complete. `urls` are sorted to generate
     * consistent URLs.
     */
    Jazzcat.getURL = function(urls, jsonpCallback) {
        return defaults.base + (defaults.projectName ? '/project-' + defaults.projectName : '') +
               '/' + defaults.endpoint + '/' + jsonpCallback + '/' +
               Jazzcat.JSONURIencode(urls.slice().sort());
    };

    Jazzcat.JSONURIencode = function(obj) {
        return encodeURIComponent(JSON.stringify(obj));
    };

    /**
     * Regex generator used to match Jazzcat calls in an HTML string.
     * Generates regexp based on parent, which should either be head or body.
     */
    var execReGenerator = function(parent) {
        return new RegExp("<script[^>]*?>(true|false),['\"]" +
            parent + "['\"]," +
            defaults.execCallback.replace(/\./g, '\\.') +
            "\\('([\\s\\S]*?)'\\);<\\/script", "gi");
    };

    /**
     * Inserts one Jazzcat loader script into the document, either for
     * scripts in the body, or scripts in the head (specified by parent arg)
     */
    Jazzcat.insertLoadersIntoHTMLString = function(html) {
        var addedCacheLoader = false;

        var insert = function(html, parent) {
            var match;
            var bootstrap;
            var firstIndex = -1;
            var uncached = [];

            // Find the first Jazzcat call and gather all the uncached scripts.
            var execRe = execReGenerator(parent);

            while (match = execRe.exec(html)) {
                if (firstIndex == -1) firstIndex = match.index;
                if (match[1] === "false") uncached.push(match[2]);
            }

            if (firstIndex == -1) {
                return html;
            }

            bootstrap = Jazzcat.getLoaderScripts(uncached, defaults.loadCallback, addedCacheLoader);

            // If we had not added the cache loader, and any scripts come back 
            // from the getLaoderScripts method, we can expect that we have now 
            // added it
            if (!addedCacheLoader && bootstrap.length > 0) {
                addedCacheLoader = true;
            }

            // Transform all bootstrap scripts into a string
            var bootstrapString = bootstrap.map(function(script, index) {
                return Utils.outerHTML(script);
            }).join('');

            return html.substr(0, firstIndex) + bootstrapString + html.substr(firstIndex);
        };
        // Since bootloader jazzcat scripts must be placed before the first external script,
        // two seperate bootloader scripts are inserted - one for scripts in the head,
        // and one for scripts in the body. If there was only one jazzcat request for
        // all the concatinated scripts in the document, it could cause every script to
        // load in the head, which would block rendering. Therefore, we concatinate scripts
        // in the head and body seperately.
        html = insert(html, "head");
        html = insert(html, "body");
        return html;
    };


    /**
     * Overrides `Capture.enable` to insert a Jazzcat bootloader to fetch all
     * uncached scripts from the Jazzcat service before executing any Jazzcat calls.
     */
    var oldEnable = Capture.enable;
    Capture.enable = function() {
        var html = oldEnable.apply(Capture, arguments);
        html = Jazzcat.insertLoadersIntoHTMLString(html);
        return html;
    };

    return Jazzcat;
});
