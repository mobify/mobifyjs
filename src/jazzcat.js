/**
 * httpCache: An implementation of an in memory HTTP cache that persists data to
 * localStorage.
 */
define(function() {

  var Jazzcat = window.Jazzcat = {};

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
    , cache = {};

    Jazzcat.httpCache = {
          get: get
        , set: set
        , load: load
        , save: save
        , reset: reset
      };


    /**
     * httpCache.utils: HTTP 1.1 Caching header helpers.
     */
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

      , utils = Jazzcat.httpCache.utils = {
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


        /**
        * combineScripts: Clientside API to the combo service.
        */
        var httpCache = Jazzcat.httpCache;

        var absolutify = document.createElement('a');

        Jazzcat.combineScripts = function(scripts) {
            // turn scripts into an array
            scripts = Array.prototype.slice.call(scripts);

            // Fastfail if there are no scripts or if required modules are missing.
            if (!scripts.length || !window.localStorage || !window.JSON) {
                return scripts;
            }

            // Takes a list of candidate script elements
            var uncached = []
              , combo = false
              , bootstrap
              , url
              , i
              , ii;

            for (i=0,ii=scripts.length;i<ii;i++) {
                var script = scripts[i];
                script.parentNode.removeChild(script);
            }

            httpCache.load();

            for (var i=0,ii=scripts.length;i<ii;i++) {
                var script = scripts[i];
                if (! script.hasAttribute(defaults.attribute)) continue;
                combo = true; // flag to true if we combine at least one script
                absolutify.href = script.getAttribute(defaults.attribute);
                url = absolutify.href;
                if (!httpCache.get(url)) {
                  uncached.push(url);
                }
                script.removeAttribute(defaults.attribute);
                script.className += ' x-combo';
                script.innerHTML = defaults.execCallback + "('" + url + "');";
            }

            if (!combo) {
                return scripts;
            }

            bootstrap = document.createElement('script')

            if (uncached.length) {
                bootstrap.src = getURL(uncached, defaults.loadCallback);
            } else {
                bootstrap.innerHTML = defaults.loadCallback + '();';
            }

            scripts.unshift(bootstrap);                
            return scripts;
        }

        , defaults = Jazzcat.combineScripts.defaults = {
              selector: 'script'
            , attribute: 'x-src'
            , endpoint: '//jazzcat.mobify.com/jsonp/'
            , execCallback: 'Jazzcat.combo.exec'
            , loadCallback: 'Jazzcat.combo.load'
        };

        Jazzcat.combo = {
              /**
               * Emit a <script> tag to execute the contents of `url` using 
               * `document.write`. Prefer loading contents from cache.
               */
              exec: function(url) {
                  var resource;

                  if (resource = httpCache.get(url, true)) {
                      url = httpCache.utils.dataURI(resource);
                  }
                  
                  // Firefox will choke on closing script tags passed through
                  // the ark.
                  document.write('<script src="' + url + '"><\/scr'+'ipt>');
              }

              /**
               * Callback for loading the httpCache and storing the results of a combo
               * query.
               */
            , load: function(resources) {
                  var resource, i, ii, save = false;
                  
                  httpCache.load()

                  if (!resources) return;

                  for (i = 0,ii=resources.length; i<ii; i++) {
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
        , getURL = function(urls, callback) {
              return defaults.endpoint + callback + '/' + JSONURIencode(urls.slice().sort());
          }

        , JSONURIencode = Mobify.JSONURIencode = function(obj) {
              return encodeURIComponent(JSON.stringify(obj));
          };

      // Mobify.cssURL = function(obj) {
      //     return '//combo.mobify.com/css/' + JSONURIencode(obj)
      // }


      return Jazzcat;

});
