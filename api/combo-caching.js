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
        var cacheControl, maxAge, expires, now;
        now = Date.now();

        // If there's a max-age cache-control directive, return it
        if (cacheControl = response.headers['cache-control']) {
            cacheControl = ccParse(cacheControl);
            if ((cacheControl['max-age'] !== null) && 
                (cacheControl['private'] === null) &&
                (cacheControl['no-store'] === null) &&
                (cacheControl['no-cache'] === null)) {

                maxAge = parseInt(cacheControl['max-age']);
                // max-age is in seconds, these functions deal in milliseconds
                return maxAge * 1000;
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
        return 'data:' + 
            resource.headers['content-type'] + 
            (!resource['text'] ? (';base64,' + resource.body) : 
                (',' + encodeURIComponent(resource.body)));
    }


  , cache = Mobify.httpCaching = {
        /**
         * Predicate for determining whether or not a comboed resource is "stale" by
         * HTTP 1.1 caching rules.
         */
        isStale: function(resource) {
            return getAge(resource) > maxAge(resource)
        }

      , isCacheable: function(resource) {
            return getFreshnessLifetime(resource) > 0 && !isStale(resource)
        }

        /**
         * Deletes resources from the dictionary that are considered stale by 
         * HTTP 1.1 caching rules.
         */
      , evictStale: function() {
            for (var i in resources) {
                if (resources.hasOwnProperty(i) && isStale(resources[i])) {
                    delete resources[i]
                }
            }
        }

        /**
         * Takes an array of urls to be comboed, returns a list of those URLs that 
         * are not already in the resources dictionary.
         */
      , notCachedUrls: function(urls) {        
            var notCachedUrls = [];
            for (var i = 0; i < urls.length; i++) {
                if (!(resources[urls[i]])) {
                    notCachedUrls.push(urls[i]);
                }
            }

            return notCachedUrls;
        }

        /**
         * Takes an array of urls to be comboed, returns those which are already in 
         * the resources dictionary.
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
        var k = 'MobifyTestLocalStorage', v = 'Yay!';
        try {
            localStorage.setItem(k, v);
            if(v === localStorage.getItem(k)) {
                localStorage.removeItem(k);
                return true;
            } else {
                return false;
            }
        } catch(e) {
            return false;
        }
    })()

    // Global store of resources downloaded with the combo service.
  , resources = {}

  , storeResource = function(resource) {
        var url = resource.url;

        /* ensure this response was successfully fetched by the service */
        if (resource.status == 'ready') {
            resources[url] = resource;
        } else {
            console.log("Combo service failed to retrieve: %s", url);
        }
    }


    /* asynchronously recursive function that attempts to whittle down a 
       cache to a storeable size */
  , evictAndStore = function(resources, attempts) {
        var serialzed;
        if (attempts == 0) {
            console.log('Mobify.combo.dehydrateCache: evict and store attempts exceeded, aborting');
        // get rid of something.
        } else {
            evictOne(resources);
            try {
                serialzed = JSON.stringify(resources)
            } catch(e) {
                console.log("Mobify.combo.dehydrateCache error stringifying: " + e.message);
                return;
            }

            try {
                localStorage.setItem(combo.key, serialzed);
            // If localStorage is full, try again with one less item, "co-operatively".
            } catch(e) {
                setTimeout(function() {
                    evictAndStore(resources, attempts - 1)
                }, 0);
            }
        }
    }

    /* evict one item from a set of resources */
    /* I FOUND YOU FIRST cache eviction policy, bad, but fast! REPLACE ME */
  , evictOne = function(resources) {
        for (var i in resources) {
            if (resources.hasOwnProperty(i)) {
                delete resources[i];
                return;
            }
        }
    }

  , combo = Mobify.combo = {

        resources: resources

      , key: 'Mobify-Combo-Cache-v1.0'

        /**
         * Store a resoruce or an array of resources from the mobify combo service 
         * in our resource dictionary.
         */
      , store: function(r) {
            if (r instanceof Array) {
                for (var i = 0; i < r.length; i++) {
                    storeResource(r[i]);
                }
            } else {
                storeResource(r);
            }
        }

        /**
         * Retrieve a JS resource from the combo.resources object and write out a 
         * script tag with it as a dataURI.
         * Note, document.writing the script tag is probably the only way to 
         * preserve execution order: 
         * http://blog.getify.com/ff4-script-loaders-and-order-preservation/
         */
      , loadSync: function(url) {
            var r;
        
            /* do a little accounting for caching purposes */
            if (r = resources[url]) {
                r.lastUsed = Date.now();
                r.useCount = r.useCount++ || 1
                /* if we have the resource in our dictionary, use data uri rather 
                than a network uri */
                url = dataURI(r)
            }
            /* write out a script tag which contains either the data uri of the 
               resource or the original network uri if for some reason it was not in
               combo's resource dictionary */
            //console.log('document.write: <script src="' + url + '"></script>')
            document.write('<script src="' + url + '"></script>');
        }


        /**
         * Get keys out of the localStorage cache and into our in-memory reosurce 
         * dictionary,
         */
      , rehydrateCache: function() {
            if (!localStorageAvailable) return;

            var r, i, cacheContents = localStorage.getItem(this.key);
            if (cacheContents !== null) {
                try {
                    cacheContents = JSON.parse(cacheContents);
                } catch(e) {
                    console.log('Mobify.combo.rehydrateCache: error parsing localStorage[' + 
                        this.key + ']: ', e.message);
                    return;
                }

                // Extract keys which are not loaded.
                for (i in cacheContents) {
                    if (cacheContents.hasOwnProperty(i) && !resources[i]) {
                        resources[i] = cacheContents[i];
                    }
                }
            }
        }

        /**
         * Store keys from the local reource dictionary back into the localStorage 
         * cache.
         */
      , dehydrateCache: function() {
            if (!localStorageAvailable) return;

            var MAX_ATTEMPTS = 10
              , toBeCached = {}
              , serialized;
    
            // start by shallow copying the global resources dictionary, since 
            // we're going to modify its key list, but not its values
            for (var i in resources) {
                if (resources.hasOwnProperty(i)) {
                    toBeCached[i] = resources[i];
                }
            }
    
            /* serialize the shallow copy */
            try {
                serialzed = JSON.stringify(toBeCached)
            } catch(e) {
                console.log("Mobify.combo.dehydrateCache error stringifying: " + e.message);
                return;
            }

            try {
                localStorage.setItem(this.key, serialzed);
            // when localStorage is full, try again with one less item, "co-operatively"
            } catch(e) {
                setTimeout(function() {
                    evictAndStore(toBeCached, MAX_ATTEMPTS)
                }, 0);
            }
        }
    };

})(Mobify);