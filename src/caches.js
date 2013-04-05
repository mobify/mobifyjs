define(["utils"], function(Utils) {
    var Caches = {};

    var ObjectCache = Caches.ObjectCache = function() {
        this.store = {};
        return this;
    }

    Utils.extend(ObjectCache.prototype, {
        get: function(params, callback) {
            var result = {};

            for (var key in params) {
                if (!params.hasOwnProperty(key)) continue;

                var resource = this.store[key];
                if (resource && params[key]) {
                    resource.lastUsed = Date.now();
                    resource.useCount = resource.useCount++ || 1;
                }
                result[key] = resource;
            }
            callback(result);
        }
      , set: function(params, callback) {
            for (var key in params) {
                if (!params.hasOwnProperty(key)) continue;

                this.store[key] = Caches.Utils.dropStale(params[key]);
            }
            callback();
        }
      , save: function(params, callback) {
            callback();
        }
    });

    var StorageCache = Caches.StorageCache = function() {
        ObjectCache.apply(this, arguments);
        return this;
    };

    var localStorageKey = 'Mobify-Combo-Cache-v1.0';

    StorageCache.prototype = new ObjectCache();
    Utils.extend(StorageCache.prototype, {
        load: function(callback) {
            var data = localStorage.getItem(localStorageKey);

            if (data === null) {
                return callback();
            }

            try {
                data = JSON.parse(data)
            } catch(err) {
                return callback();
            }

            this.set(data, callback);
        }
      , save: function(callback) {
            var resources = {}
            , resource
            , attempts = 10
            , key
            , serialized
              // End of time.
            , lruTime = 9007199254740991
            , lruKey
            , cache = this.store;

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
    });    


    var IframeCache = Caches.IframeCache = function(url) {
        ObjectCache.apply(this, arguments);
        this.callbacks = {};
        this.msgid = 0;
        return this;
    };

    var localStorageKey = 'Mobify-Combo-Cache-v1.0';

    IframeCache.prototype = new ObjectCache();
    Utils.extend(IframeCache.prototype, {
        load: function(callback) {
            var iframe = this.iframe = document.createElement('iframe');
            iframe.setAttribute('src', Jazzcat.combo.cacheUrl);
            iframe.style.display = "none";

            // TODO: If there is no body, wait with injection.
            var body = document.getElementsByTagName('body')[0];
            body.appendChild(iframe);
            var iframeCache = this;

            window.addEventListener("message", function(ev) {
                if (ev.source !== iframe.contentWindow) return;

                var data = ev.data;

                if (data === "ready") return callback();

                var deferred = iframeCache.callbacks[data.msgid];
                console.log('deferred', data, deferred, data.msgid);
                delete iframeCache.callbacks[data.msgid];

                if (deferred.message.method === "get") {
                    ObjectCache.prototype.set.call(iframeCache, data.result, function() {
                        ObjectCache.prototype.get.call(iframeCache, deferred.params, deferred.callback);
                    });
                } else deferred.callback();

            }, false);
        }
      , msg: function(method, params, callback) {
            var remoteQuery = {};
            for (var key in params) {
                if (!(key in this.store)) remoteQuery[key] = params[key];
            }

            for (var key in remoteQuery) {
                // Run once if we do not have a parameter cached locally
                var message = {method: method, query: remoteQuery, msgid: ++this.msgid};
                this.callbacks[this.msgid] = {message: message, params: params, callback: callback};
                this.iframe.contentWindow.postMessage(message, '*');
                return;
            }

            // Or answer right away if we do have everything on hand
            ObjectCache.prototype[method].call(this, params, callback);
            
        }
      , get: function(params, callback) {
            var iframeCache = this;
            console.log('get', params);
            this.msg('get', params, function(result) {
                Utils.extend(iframeCache.store, result);
                callback(result);
            });
        }
      , set: function(params, callback) {
            ObjectCache.prototype.set.apply(this, arguments);
        }    
      , save: function(callback) {
            var message = {method: 'save', query: this.store, msgid: ++this.msgid};
            this.callbacks[this.msgid] = {message: message, callback: callback};
            this.iframe.contentWindow.postMessage(message, '*');
        }    
    });

    /**
     * httpCache.utils: HTTP 1.1 Caching header helpers.
     */
    /**
    * Regular expressions for cache-control directives.
    * See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9
    */
    var ccDirectives = /^\s*(public|private|no-cache|no-store)\s*$/
    var ccMaxAge = /^\s*(max-age)\s*=\s*(\d+)\s*$/

    /**
     * Returns an object representing a parsed HTTP 1.1 Cache-Control directive.
     * The object may contain the following relevant cache-control properties:
     * - public
     * - private
     * - no-cache
     * - no-store
     * - max-age
     */
    var ccParse = function (directives) {
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
    };

    var cacheUtils = Caches.Utils = {
        /**
         * Returns a data URI for `resource` suitable for executing the script.
         */
        dataURI: function(resource) {
            var contentType = resource.headers['content-type'] || 'application/x-javascript'
            return 'data:' + contentType + (!resource.text
                 ? (';base64,' + resource.body)
                 : (',' + encodeURIComponent(resource.body)));
        },

        dropStale: function(resource) {
            if (!resource) return;
            if (!this.isStale(resource)) return resource;
        },

        /**
         * Returns `true` if `resource` is stale by HTTP/1.1 caching rules.
         * Treats invalid headers as stale.
         */
        isStale: function(resource) {
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

    return Caches;
});