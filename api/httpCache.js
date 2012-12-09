define(["./mobifyjs"], function(Mobify) {

/**
 * httpCache: An implementation of an in memory HTTP cache that persists data to
 * localStorage.
 */

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
    };

/**
 * httpCache.utils: HTTP 1.1 Caching header helpers.
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

    return httpCache;
});