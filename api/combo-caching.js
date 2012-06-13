(function() {

/**
 * HTTP 1.1 Caching header helpers
 */

// Regular expressions for cache-control directives.
// See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9
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
     * ccParse - takes a string argument that is an HTTP 1.1 
     * Cache-Control directive and returns a parsed objects with booleans set for 
     * specified values and integers for max-age and s-maxage
     */
  , ccParse = function (directive) {
        var directives = directive.split(',')

            // A default object with keys for every cache-control response property,
            // all of them will be null or boolean except max-age and s-maxage which 
            // should be positive integers
          , parsedDirective = {
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

        directives.forEach(function(d) {
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
     * A function to compute the age of an HTTP response, returns the age in 
     * milliseconds
     */
  , getAge = function(response) {
        var apparentAge, date, age = 0, now = Date.now();
        if (date = response.headers['Date']) {
            date = Date.parse(date);
        } else {
            date = now;
        }
        return apparentAge = now - date;
    }

    /**
     * getFreshnessLifetime - returns the freshnessLifetime of the response in 
     * milliseconds
     */
  , getFreshnessLifetime = function (response) {
        var cacheControl, maxAge, expires, now, date;
        now = Date.now();

        // If there's a max-age cache-control directive, return it
        if ( (cacheControl = response.headers['cache-control']) && 
            (date = response.headers['date']) ) {

            // parse out the cache control header and date
            date = Date.parse(response.headers.date);
            cacheControl = ccParse(cacheControl);

            if ((cacheControl['max-age'] !== null) && 
                (cacheControl['private'] === null) &&
                (cacheControl['no-store'] === null) &&
                (cacheControl['no-cache'] === null)) {

                // max-age header is in seconds, these functions deal in ms
                maxAge = parseInt(cacheControl['max-age']) * 1000;

                expires = date + maxAge;                
                return expires - now;
            }
        }

        // Otherewise, try to compute a max-age from the Expires header
        if (expires = response.headers['expires']) {
            expires = Date.parse(expires);
            return expires - now;
        }

        // Otherwise, the freshness lifetime is 0
        return 0;
    }

    /**
     * maxAge - takes an http response object, returns a new max-age value, 
     * in seconds, for a new response containing it to be sent now.
     */
  , maxAge = function (response) {
        var newMaxAge = getFreshnessLifetime(response) - getAge(response);
        return Math.floor(newMaxAge/1000);
    }


    /**
     * A function to create a data URI from a mobify combo resource object
     */
  , dataURI = function(resource) {
        return 'data:' + resource.headers['content-type'] + (!resource.text
                ? (';base64,' + resource.body)
                : (',' + encodeURIComponent(resource.body)));
    }

    // Global resource dictionary, to be found later at Mobify.com.resources
  , resources = {}

  , cache = Mobify.httpCaching = {

        // key used for localStorage caching
        lsKey: 'Mobify-Combo-Cache-v1.0'

        /**
         * Predicate for determining whether or not a comboed resource is "stale" by
         * HTTP 1.1 caching rules.
         */
      , isStale: function(resource) {
          return getAge(resource) > maxAge(resource)
        }

      , isCacheable: function(resource) {
            return getFreshnessLifetime(resource) > 0 && !cache.isStale(resource)
        }

        /**
         * Deletes resources from the dictionary that are considered stale by 
         * HTTP 1.1 caching rules.
         */
      , evictStale: function() {
            for (var key in resources) {
                if (resources.hasOwnProperty(key) && cache.isStale(resources[key])) {
                    delete resources[key]
                }
            }
        }

        /**
         * Given an array of URLs, returns an array of the ones that are not cached.
         */
      , notCachedUrls: function(urls) {        
            var notCachedUrls = [];
            for (var i = 0; i < urls.length; i++) {
                if (!(resources[urls[i]])) {
                    notCachedUrls.push(urls[i]);
                }
            }

            //DEBUG
            // console.log('urls: ' + JSON.stringify(urls));
            // console.log('notCachedUrls: ' + JSON.stringify(notCachedUrls));

            return notCachedUrls;
        }

        /**
         * Given an array of URLs, returns an array of the ones that are cached.
         */
      , cachedUrls: function(urls) {
            var cachedUrls = [];
            for (var i = 0; i < urls.length; i++) {
                if (resources[urls[i]]) {
                    cachedUrls.push(urls[i]);
                }
            }
            
            return cachedUrls;
        }
    }

  , localStorageAvailable = (function() {
        var key = 'MobifyTestLocalStorage'
          , val = 'Yay!';

        try {
            localStorage.setItem(key, val);
            if (val === localStorage.getItem(key)) {
                localStorage.removeItem(key);
                return true;
            } else {
                return false;
            }
        } catch(e) {
            return false;
        }
    })()

  , storeResource = function(resource) {
        var url = resource.url;

        if (resource.status == 'ready') {
            combo.resources[url] = resource;
        } else {
            console.log("Combo service failed to retrieve: %s", url);
        }
    }


    /**
     * asynchronously recursive function that attempts to whittle down a 
     * cache to a storeable size
     */
  , evictAndStore = function(resources, attempts) {
        var serialzed;

        if (attempts == 0) {
            console.log('Mobify.combo.storeCache: evict and store attempts exceeded, aborting');
        // get rid of something.
        } else {
            evictOne(resources);

            try {
                serialzed = JSON.stringify(resources)
            } catch(e) {
                console.log("Mobify.combo.storeCache error stringifying: " + e.message);
                return;
            }

            try {
                localStorage.setItem(cache.lsKey, serialzed);
            // If localStorage is full, try again with one less item, "co-operatively".
            } catch(e) {
                setTimeout(function() {
                    evictAndStore(resources, attempts - 1)
                }, 0);
            }
        }
    }

    /** 
     * Evict one item from a set of resources, using a least recently used cache 
     * eviction policy.
     */
  , evictOne = function(resources) {
            // beginning of the epoch.
        var START_OF_TIME = 0 
            // end of the epoch, 2^53 - 1 milliseconds after the beginning, 
            // 285000+ years from now.
          , END_OF_TIME = 9007199254740991 
          , lruKey
          , lruTime = END_OF_TIME
          , resource;

        for (var key in resources) {
            if (resources.hasOwnProperty(key)) {
                resource = resources[key];

                if (resource.lastUsed) {
                    // if this resource has been used less recently than the so 
                    // far least recently used resource, this gets nominated 
                    if (resource.lastUsed <= lruTime) {
                        lruKey = key;
                        lruTime = resource.lastUsed;
                    }
                } else {
                    // if lastUsed is not set, we will consider this to never 
                    // have been used, so, this key gets nominated
                    lruKey = key;
                    lruTime = START_OF_TIME;
                    break;
                }
            }
        }
        // lruKey will be set by now
        delete resources[lruKey];
    }

  , combo = Mobify.combo = {

        resources: resources

        /**
         * Store a resoruce or an array of resources from the mobify combo service 
         * in our resource dictionary.
         */
      , store: function(resource) {
            if (resource instanceof Array) {
                for (var i = 0; i < resource.length; i++) {
                    storeResource(resource[i]);
                }
            } else {
                storeResource(resource);
            }

            combo.storeCache();
        }

        /**
         * Get the resource `url` from the cache and inject a script to execute it.
         */
      , loadSync: function(url) {
            var resource;
        
            if (resource = resources[url]) {
                resource.lastUsed = Date.now();
                resource.useCount = resource.useCount++ || 1
                url = dataURI(resource)
            }

            document.write('<script src="' + url + '"></script>');
        }

      , loadAsync: function(url) {
            var r, s;
            s = document.createElement('script');
            
            // add it if we have it
            if (r = resources['url']) {
                r.lastUsed = Date.now();
                r.useCount = r.useCount++ || 1
                s.src = dataURI(r);
            } else {
                // otherwise, make the browser get it itself
                s.src = url;
            }
            document.body.appendChild(s);
        }

        , storeAndLoadAsync: function(resources) {
            combo.store(resources);

            // iterate through the resources we've been asked to and load them
            for(var i = 0; i < resources.length; i++) {
                combo.loadAsync(resources[i]['url']);
            }
        }

        /* A guard property to ensure that we only rehydrate the cache once */
      , rehydratedCache: false  

        /**
         * Deserialize resources from localStorage into `resources`.
         * A flag remembers if we've already done this.
         */   
      , loadCache: function() {
            if (!localStorageAvailable || combo.rehydratedCache == true) {
                return;
            }
            combo.rehydratedCache = true;

            //DEBUG
            console.log("rehydrateCache()")

            var cacheContents = localStorage.getItem(cache.lsKey)
              , key;

            if (cacheContents === null) return;
                
            try {
                cacheContents = JSON.parse(cacheContents);
            } catch(e) {
                console.log('Mobify.combo.rehydrateCache: Error parsing localStorage[' + this.lsKey + ']: ', e.message);
                return;
            }

            // Extract keys which are not already loaded.
            for (key in cacheContents) {
                if (cacheContents.hasOwnProperty(key) && !resources[key]) {
                    resources[key] = cacheContents[key];
                }
            }
        }

        /**
         * Store keys from the local resource dictionary back into the localStorage 
         * cache.
         */
      , storeCache: function() {
            if (!localStorageAvailable) return;

            var MAX_ATTEMPTS = 10
              , toBeCached = {};
    
            // Shallow copying the global resources dictionary, since we may
            // evict resources to store things in the cache and change keys.
            for (var key in resources) {
                if (resources.hasOwnProperty(key)) {
                    toBeCached[key] = resources[key];
                }
            }
            
            // This may be expensive, so do it on next tick.
            setTimeout(function() {
                try {
                    var serialized = JSON.stringify(toBeCached)
                } catch(e) {
                    console.log("Mobify.combo.storeCache error stringifying: " + e.message);
                    return;
                }

                // An exception is raised when localStorage is ful.
                try {
                    localStorage.setItem(cache.lsKey, serialized);
                    console.log('storeCache()')
                } catch(e) {
                    console.log('error');
                    setTimeout(function() {
                        evictAndStore(toBeCached, MAX_ATTEMPTS)
                    }, 0);
                }
            }, 0);
        }

        /**
         * Clear out the cache both in localStorage and in memory
         */
      , clearCache: function() {
            if (localStorageAvailable) {
                localStorage.removeItem(cache.lsKey);
            }

            Mobify.combo.resources = resources = {};
        }  
    };

})(Mobify);
