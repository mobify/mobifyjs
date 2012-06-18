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

        if (data === null) return;

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
var ccPublic = /^\s*public\s*$/
  , ccPrivate = /^\s*private\s*$/
  , ccNoCache = /^\s*no-cache\s*$/
  , ccNoStore = /^\s*no-store\s*$/
  , ccNoTransform = /^\s*no-store\s*$/
  , ccMustRevalidate = /^\s*must-revalidate\s*$/
  , ccProxyRevalidate = /^\s*proxy-revalidate\s*$/
  , ccMaxAge = /^\s*max-age\s*=\s*(\d+)\s*$/
  , ccSMaxAge = /^\s*s-maxage\s*=\s*(\d+)\s*$/

    /**
     * Returns an object representing a parsed HTTP 1.1 Cache-Control directive.
     * The object will have keys for all cache-control response properties.
     * Properties are null or boolean except for max-age and s-maxage which  
     * should be positive integers
     */
  , ccParse = function (directive) {
        var parsedDirective = {
                'public': null
              , 'private': null
              , 'no-cache': null
              , 'no-store': null
              , 'no-transform': null
              , 'must-revalidate': null
              , 'proxy-revalidate': null
              , 'max-age': null
              , 's-maxage': null
            };

        directive.split(',').forEach(function(d) {
            var matches;
            if (ccPublic.test(d)) parsedDirective['public'] = true;
            else if (ccPrivate.test(d)) parsedDirective['private'] = true;
            else if (ccNoCache.test(d)) parsedDirective['no-cache'] = true;
            else if (ccNoStore.test(d)) parsedDirective['no-store'] = true;
            else if (ccNoTransform.test(d)) parsedDirective['no-transform'] = true;
            else if (ccMustRevalidate.test(d)) {
                parsedDirective['must-revalidate'] = true;
            } else if (ccProxyRevalidate.test(d)) { 
                parsedDirective['proxy-revalidate'] = true;
            } else if (matches = ccMaxAge.exec(d)) {
                parsedDirective['max-age'] = matches[1];
            } else if (matches = ccSMaxAge.exec(d)) { 
                parsedDirective['s-maxage'] = matches[1];
            }
        })

        return parsedDirective;
    }

    /**
     * Returns the age of `resource` in milliseconds.
     */
  , getAge = function(resource) {
        var date;
        return (date = resource.headers.date) ? Date.now() - Date.parse(date) : 0;
    }

    /**
     * Returns the freshness lifetime of `resource` in milliseconds.
     */
  , getFreshnessLifetime = function(resource) {
        var cacheControl
          , maxAge
          , expires
          , now = Date.now()
          , headers = resource.headers
          , date;

        // If there's a max-age cache-control directive, return it
        if ((cacheControl = headers['cache-control']) && (date = headers.date)) {

            // Parse out the cache control header and date
            date = Date.parse(headers.date);
            cacheControl = ccParse(cacheControl);

            if ((cacheControl['max-age'] !== null) && 
                (cacheControl['private'] === null) &&
                (cacheControl['no-store'] === null) &&
                (cacheControl['no-cache'] === null)) {

                // max-age header is in seconds, these functions deal in ms.
                maxAge = parseInt(cacheControl['max-age']) * 1000;

                expires = date + maxAge;                
                return expires - now;
            }
        }

        // Otherwise, try to compute a max-age from the Expires header.
        if (expires = headers.expires) {
            expires = Date.parse(expires);
            return expires - now;
        }

        // Otherwise, the freshness lifetime is 0.
        return 0;
    }

    /**
     * Returns a max-age value for `resource` in seconds.
     */
  , maxAge = function(resource) {
        var newMaxAge = getFreshnessLifetime(resource) - getAge(resource);
        return Math.floor(newMaxAge / 1000);
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
         * Returns `true` if `resource` is stale by HTTP 1.1 caching rules.
         */
      , isStale: function(resource) {
            return getAge(resource) > maxAge(resource)
        }
    };

})(Mobify.httpCache);

/**
 * combineScripts: Clientside API to the combo service.
 */
(function(window, document, Mobify) {

var httpCache = Mobify.httpCache

  , absolutify = document.createElement('a')

  , combineScripts = function($els) {
        var $scripts = $els.filter(defaults.selector).add($els.find(defaults.selector)).remove()
          , uncached = []
          , combo = false
          , bootstrap
          , url;

        // Fastfail if there are no scripts or if required modules are missing.
        if (!$scripts.length || !window.localStorage || !window.JSON) return $scripts;

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
            this.innerHTML = defaults.execCallback + "('" + url + "');";
        });

        if (!combo) return $scripts;

        bootstrap = document.createElement('script')

        if (uncached.length) {
            bootstrap.src = getURL(uncached, defaults.loadCallback);
        } else {
            bootstrap.innerHTML = defaults.loadCallback + '()';
        }

        $scripts = $(bootstrap).add($scripts);
        return $scripts;
    }

  , defaults = combineScripts.defaults = {
        selector: 'script'
      , attribute: 'x-src'
      , endpoint: '//combo.mobify.com/jsonp/'
      , execCallback: 'Mobify.combo.exec'
      , loadCallback: 'Mobify.combo.load'
    }

  , combo = Mobify.combo = {
        /**
         * Emit a <script> tag to execute the contents of `url` using 
         * `document.write`. Prefer loading contents from cache.
         */
        exec: function(url) {
            var resource;

            if (resource = httpCache.get(url, true)) {
                url = httpCache.utils.dataURI(resource);
            }

            document.write('<script src="' + url + '"><\/script>');
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
                    httpCache.set(resource.url, resource)
                }
            }

            if (save) httpCache.save();
        }
    }

    /**
     * Returns a URL suitable for use with the combo service.
     */
  , getURL = function(urls, callback) {
        return defaults.endpoint + callback + '/' + JSONURIencode(urls);
    }

  , JSONURIencode = Mobify.JSONURIencode = function(obj) {
        return encodeURIComponent(JSON.stringify(obj));
    };

Mobify.$.fn.combineScripts = function() {
    return combineScripts.call(window, this)
}

Mobify.cssURL = function(obj) {
    return '//combo.mobify.com/css/' + JSONURIencode(obj)
}

})(this, document, Mobify);