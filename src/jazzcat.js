/**
 * httpCache: An implementation of an in memory HTTP cache that persists data to
 * localStorage.
 */
define(["utils", "capture", "caches"], function(Utils, Capture, Caches) {

    var Jazzcat = window.Jazzcat = {};
    var absolutify = document.createElement('a')
    var httpCache;

    /**
    * combineScripts: Clientside API to the combo service.
    */
    Jazzcat.combineScripts = function(scripts, options) {
        var opts;

        if (options) {
            opts = Utils.extend(defaults, options);
        } else {
            opts = defaults;
        }

        // Fastfail if there are no scripts or if required modules are missing.
        if (!scripts.length || !window.localStorage || !window.JSON) {
            return scripts;
        }

        var scriptArray = [].slice.call(scripts);
        var request = {};

        scriptArray.forEach(function(script) {
            var url, isCached;

            if (!script.hasAttribute(opts.attribute)) return;

            absolutify.href = script.getAttribute(opts.attribute);
            url = absolutify.href.split('#')[0];

            script.removeAttribute(opts.attribute);
            script.setAttribute('data-orig-src', url);
            if (opts.forceDataURI) script.setAttribute('data-force-data-uri', 'true');

            request[url] = true;
        });

        httpCache || Jazzcat.combo.makeCache(opts.storageSpace);
        httpCache.load(function() {
            httpCache.get(request, function(response) {
                scriptArray.forEach(function(script) {
                    var resource = response[script.getAttribute('data-orig-src')];
                    Jazzcat.combo.fulfillScript(script, resource);
                });
                opts.callback && opts.callback();
            });
        });

        return scripts;
    };


    var defaults = Jazzcat.combineScripts.defaults = {
            selector: 'script'
          , attribute: 'x-src'
          , proto: '//'
          , host: 'jazzcat.mobify.com'
          , endpoint: 'jsonp'
          , execCallback: 'Jazzcat.combo.exec'
          , loadCallback: 'Jazzcat.combo.load'
          , projectName: ''
          , storageSpace: ''
    };

    Jazzcat.combo = {
        makeCache: function(url) {
            this.cacheUrl = url;
            httpCache = url ? new Caches.IframeCache(url) : new Caches.StorageCache();
        },

        fulfillScript: function(script, resource, fallback) {
            if (!resource) {
                if (fallback) {
                    script.setAttribute('src', script.getAttribute('data-orig-src'));
                } else {
                    var oldSrc = script.getAttribute('data-orig-src');
                    if (!oldSrc) return;

                    script.innerHTML = defaults.execCallback + "('" + oldSrc + "',"
                      + !!script.getAttribute('data-force-data-uri') + ");";
                }
                return;
            }

            if (script.getAttribute('data-force-data-uri')) {
                script.setAttribute('src', Caches.Utils.dataURI(resource))
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

                script.removeAttribute(defaults.attribute);
                script.innerHTML = resource.body.replace(/(<\/scr)(ipt\s*>)/ig, '$1\\$2');
            }
        },

        /**
         * Emit a <script> tag to execute the contents of `url` using 
         * `document.write`. Prefer loading contents from cache.
         */
        exec: function(url, useDataURI) {
            var getObj = {};
            getObj[url] = true;

            var resource = Caches.ObjectCache.prototype.get.call(httpCache, getObj, function(result) {
                var script = document.createElement('script');
                script.setAttribute('data-orig-src', url);
                Jazzcat.combo.fulfillScript(script, result[url], true);
                document.write(script.outerHTML);
            });
        },

        /**
         * Callback for loading the httpCache and storing the results of a combo
         * query.
         */
        load: function(resources) {
            var resource, i, ii, save = false, isLoaded, needsSave;
            
            if (!resources) return;


            // Some fun witchcraft here. The main issue is that load() could finish
            // immediately for localStorage variant of cache, or could be async if
            // caching is done via iframe.

            // So, we run the save() right away if load() already finished, or delay it
            // if load() is taking its sweet time. For delayed load() (iframe) case,
            // we do set() BEFORE load. That is okay, as iframe load does not actually
            // deliver any state across until prompted by get(), and postflood is
            // completely get-free.

            httpCache.load(function() {
                isLoaded = true;
                if (needsSave) httpCache.save(function(){});
            });  
            var setObj = {};
            for (i = 0,ii=resources.length; i<ii; i++) {
                resource = resources[i];
                if (resource.status == 'ready') {
                    save = true;
                    setObj[encodeURI(resource.url)] = resource;
                }
            }
            if (save) httpCache.set(setObj, function() {
                if (isLoaded) httpCache.save(function(){});
                else {
                    needsSave = true;
                }
            });
        },

        getLoaderScript: function(uncached, loadCallback) {
            var bootstrap = document.createElement('script')
            if (uncached.length) {
                bootstrap.src = Jazzcat.getURL(uncached, loadCallback);
            } else {
                bootstrap.innerHTML = loadCallback + '();';
            }
            var makeCacheScript = '<script>Jazzcat.combo.makeCache("'
              + this.cacheUrl.replace(/"/g, "\"") + '");</scr' + 'ipt>';

            return makeCacheScript + bootstrap.outerHTML;
        }
    };

    /**
     * Returns a URL suitable for use with the combo service. Sorted to generate
     * consistent URLs.
     */
    Jazzcat.getURL = function(urls, callback) {
        return defaults.proto + defaults.host + 
          (defaults.projectName ? '/project-' + defaults.projectName : '') + 
          '/' + defaults.endpoint + '/' + callback + '/' + 
          Jazzcat.JSONURIencode(urls.slice().sort());
    };

    Jazzcat.JSONURIencode = function(obj) {
        return encodeURIComponent(JSON.stringify(obj));
    };

    // Mobify.cssURL = function(obj) {
    //     return '//combo.mobify.com/css/' + JSONURIencode(obj)
    // }


    var oldEnable = Capture.enable;
    var enablingRe = new RegExp("<script[^>]*?>"
      + defaults.execCallback.replace(/\./g, '\\.')
      + "\\('([\\s\\S]*?)'\\,(true|false)\\);<\\/script", "gi");

    /**
     * Overrides enable to replace scripts with bootloaders
     */
    Capture.enable = function() {
        var match
        , bootstrap
        , firstIndex = -1
        , uncached = []
        , htmlStr = oldEnable.apply(Capture, arguments);

        while (match = enablingRe.exec(htmlStr)) {
            uncached.push(match[1]);
            if (firstIndex == -1) firstIndex = match.index;
        }
        if (firstIndex == -1) return htmlStr;

        bootstrap = Jazzcat.combo.getLoaderScript(uncached, defaults.loadCallback);

        return htmlStr.substr(0, firstIndex) + bootstrap + htmlStr.substr(firstIndex);
    };


    return Jazzcat;

});
