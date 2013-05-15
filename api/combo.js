/**
 * httpCache: An implementation of an in memory HTTP cache that persists data to
 * localStorage.
 */
(function(window, Mobify) {
    /**
     * Retrieve `key` from the cache. Mark as used if `increment` is set.
     */
var get = function(key, increment) {
        // Ignore anchors.
        var resource = cache[key.split('#')[0]];

        if (resource && increment) {
            resource.lastUsed = Date.now();
            resource.useCount = resource.useCount++ || 1;
        }

        return resource;
    }

  , set = function(key, val) {
        cache[key] = val;
    }

    /**
     * Load the persistent cache into memory. Ignore stale resources.
     */
  , load = function() {
        var data = localStorage.getItem(localStorageKey)
          , key;

        if (data === null) {
            return;
        }

        try {
            data = JSON.parse(data)
        } catch(err) {
            return;
        }

        for (key in data) {
            if (data.hasOwnProperty(key) && !httpCache.utils.isStale(data[key])) {
                set(key, data[key]);
            }
        }
    }

    /**
     * Save the in-memory cache to disk. If the disk is full, use LRU to drop
     * resources until it will fit on disk.
     */
  , save = function(callback) {
        var resources = {}
          , resource
          , attempts = 10
          , key
          , serialized
            // End of time.
          , lruTime = 9007199254740991
          , lruKey;

        for (key in cache) {
            if (cache.hasOwnProperty(key)) {
                resources[key] = cache[key]
            }
        }

        (function persist() {
            setTimeout(function() {
                try {
                    serialized = JSON.stringify(resources);
                } catch(err) {
                    if (callback) callback(err);
                    return;
                }

                try {
                    localStorage.setItem(localStorageKey, serialized)
                } catch(err) {
                    if (!--attempts) {
                        if (callback) callback(err);
                        return;
                    }

                    for (key in resources) {
                        if (!resources.hasOwnProperty(key)) continue;
                        resource = resources[key]

                        // Nominate the LRU.
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
                    persist();
                    return;
                }

                if (callback) callback();

            }, 0);
        })();
    }

  , reset = function(val) {
        cache = val || {};
    }

  , localStorageKey = 'Mobify-Combo-Cache-v1.0'

    // In memory cache.
  , cache = {}

  , httpCache = Mobify.httpCache = {
        get: get
      , set: set
      , load: load
      , save: save
      , reset: reset
    }

})(this, Mobify);

/**
 * httpCache.utils: HTTP 1.1 Caching header helpers.
 */
(function(httpCache) {
   /**
    * Regular expressions for cache-control directives.
    * See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9
    */
var ccDirectives = /^\s*(public|private|no-cache|no-store)\s*$/
  , ccMaxAge = /^\s*(max-age)\s*=\s*(\d+)\s*$/

    /**
     * Returns an object representing a parsed HTTP 1.1 Cache-Control directive.
     * The object may contain the following relevant cache-control properties:
     * - public
     * - private
     * - no-cache
     * - no-store
     * - max-age
     */
  , ccParse = function (directives) {
        var obj = {}
          , match;

        directives.split(',').forEach(function(directive) {
            if (match = ccDirectives.exec(directive)) {
                obj[match[1]] = true
            } else if (match = ccMaxAge.exec(directive)) {
                obj[match[1]] = parseInt(match[2])
            }
        });

        return obj;
    }

  , utils = httpCache.utils = {
        /**
         * Returns a data URI for `resource` suitable for executing the script.
         */
        dataURI: function(resource) {
            var contentType = resource.headers['content-type'] || 'application/x-javascript'
            return 'data:' + contentType + (!resource.text
                 ? (';base64,' + resource.body)
                 : (',' + encodeURIComponent(resource.body)));
        }

        /**
         * Returns `true` if `resource` is stale by HTTP/1.1 caching rules.
         * Treats invalid headers as stale.
         */
      , isStale: function(resource) {
            var headers = resource.headers || {}
              , cacheControl = headers['cache-control']
              , now = Date.now()
              , date
              , expires;

            // If `max-age` and `date` are present, and no other no other cache
            // directives exist, then we are stale if we are older.
            if (cacheControl && (date = Date.parse(headers.date))) {
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
            if (expires = Date.parse(headers.expires)) {
                return now > expires;
            }

            // Otherwise, we are stale.
            return true;
        }
    };

})(Mobify.httpCache);


/**
 * combineScripts: Clientside API to the combo service.
 */
(function(window, document, Mobify) {

var $ = Mobify.$

  , httpCache = Mobify.httpCache

  , absolutify = document.createElement('a')

  , combineScripts = function($els, opts) {
        var $scripts = $els.filter(defaults.selector).add($els.find(defaults.selector)).remove()
          , uncached = []
          , combo = false
          , bootstrap
          , url;

        // Fastfail if there are no scripts or if required modules are missing.
        if (!$scripts.length || !window.localStorage || !window.JSON) {
            return $scripts;
        }
        opts = opts || {};

        httpCache.load();

        $scripts.filter('[' + defaults.attribute + ']').each(function() {
            combo = true
            absolutify.href = this.getAttribute(defaults.attribute);
            url = absolutify.href;

            if (!httpCache.get(url)) {
                uncached.push(url);
            }

            this.removeAttribute(defaults.attribute);
            this.className += ' x-combo';
            this.innerHTML = defaults.execCallback + "('" + url + "', "
                + (!!opts.forceDataURI) + ");";
        });

        if (!combo) {
            return $scripts;
        }

        bootstrap = document.createElement('script')

        if (uncached.length) {
            bootstrap.src = getURL(uncached, defaults.loadCallback);
        } else {
            bootstrap.innerHTML = defaults.loadCallback + '();';
        }

        $scripts = $(bootstrap).add($scripts);
        return $scripts;
    }

  , defaults = combineScripts.defaults = {
        selector: 'script'
      , attribute: 'x-src'
      , proto: '//'
      , host: 'jazzcat.mobify.com'
      , endpoint: 'jsonp'
      , execCallback: 'Mobify.combo.exec'
      , loadCallback: 'Mobify.combo.load'
      , projectName: Mobify.config.projectName || ''
    }

  , combo = Mobify.combo = {
        // a copy of document.write in case it is reassigned by other scripts
        _docWrite: document.write,
        /**
         * Emit a <script> tag to execute the contents of `url` using
         * `document.write`. Prefer loading contents from cache.
         */
        exec: function(url, useDataURI) {
            var resource = httpCache.get(url, true),
                out;

            if (!resource) {
                out = 'src="' + url + '">';
            } else {
                out = 'data-orig-src="' + url + '"';

                if (useDataURI) {
                    out += ' src="' + httpCache.utils.dataURI(resource) + '">';
                } else {
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
            }

            Mobify.combo._docWrite.call(document, '<script ' + out + '<\/script>');
        }

        /**
         * Callback for loading the httpCache and storing the results of a combo
         * query.
         */
      , load: function(resources) {
            var resource, i, save = false;

            httpCache.load()

            if (!resources) return;

            for (i = 0; i < resources.length; i++) {
                resource = resources[i];
                if (resource.status == 'ready') {
                    save = true;
                    httpCache.set(encodeURI(resource.url), resource)
                }
            }

            if (save) httpCache.save();
        }
    }

    /**
     * Returns a URL suitable for use with the combo service. Sorted to generate
     * consistent URLs.
     */
  , getURL = Mobify.combo.getURL = function(urls, callback) {
        return defaults.proto + defaults.host + 
          (defaults.projectName ? '/project-' + defaults.projectName : '') + 
          '/' + defaults.endpoint + '/' + callback + '/' +
          JSONURIencode(urls.slice().sort());
    }

  , JSONURIencode = Mobify.JSONURIencode = function(obj) {
        return encodeURIComponent(JSON.stringify(obj));
    };

$.fn.combineScripts = function(opts) {
    return combineScripts.call(window, this, opts)
}

// expose defaults for testing
$.fn.combineScripts.defaults = combineScripts.defaults;

Mobify.cssURL = function(obj) {
    return '//jazzcat.mobify.com/css/' + JSONURIencode(obj)
}

})(this, document, Mobify);