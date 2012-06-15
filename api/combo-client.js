(function(Mobify) {

var $ = Mobify.$
  , caching = Mobify.httpCaching

  , combo = Mobify.combo

  , absolutify = document.createElement('a')

    /**
     * encode the given object as uri encoded JSON
     */
  , JSONURIencode = Mobify.JSONURIencode = function(object) {
        return encodeURIComponent(JSON.stringify(object));
    }

    /**
     * Generate a URL to the jsonp endpoint of the combo service for the 
     * given array of URLs
     */
  , getComboStoreURL = function(urls) {
        return defaults.endpoint + defaults.storeCallback + '/' + JSONURIencode(urls);
    }
    
  , getComboStoreAndLoadAsyncURL = function(urls) {
        return defaults.endpoint + defaults.storeAndLoadAsyncCallback + '/' + JSONURIencode(urls);
    }

    /**
     * Prepare to make combo requests by rehydrating the cache, if there is one 
     * and getting rid of stale items.
     * load, evict stale items and save back the (potentially smaller) 
     * cache to localStorage
     * Note, after this a "live copy" of the cache still exists at 
     * window.Mobify.combo.resources until "the flood"
     */
  , initializeFromCache = function() {
        combo.loadCache();
        caching.evictStale();
        combo.storeCache();
    }

    /**
     * Searches the collection for scripts and modifies them to use the `combo`
     * service. Returns a collection suitable for use with document.write.
     */
  , combineScripts = $.fn.combineScripts = function(opts) {
        var $scripts = this.filter(defaults.selector).add(this.find(defaults.selector)).remove()
          , urls = []
          , url
          , bootstrap
          , uncachedUrls;

        $scripts.filter('[' + defaults.attribute + ']').each(function() {
            absolutify.href = this.getAttribute(defaults.attribute);
            url = absolutify.href;
            urls.push(url);

            this.removeAttribute(defaults.attribute);
            this.className += ' x-combo';
            this.innerHTML = defaults.loadSyncCallback + "('" + url + "');";
        });

        initializeFromCache();

        uncached = caching.notCachedUrls(urls);

        bootstrap = document.createElement('script');

        if(opts && opts.async) {
            // return synchronous bootstrap and scripts
            if (uncached.length > 0) {
                // use web service to laod all uncached items
                bootstrap.src = getComboStoreAndLoadAsyncURL(uncached);
            } else {
                // when all items are cached, ensure cache is loaded and ready to go
                bootstrap.innerHTML = 'Mobify.combo.loadCache();';
            }

            /* build a second script tag that will be inline, and cause the cached 
               scripts to be loaded and executed asynchronously */
            cached = caching.cachedUrls(urls);
            var loadCachedAsync = '';
            for(var i = 0; i < cached.length; i++) {
                loadCachedAsync += defaults.loadAsyncCallback + 
                "('" + cached[i] + "');\n";
            }

            var cachedScriptLoader = document.createElement('SCRIPT');
            cachedScriptLoader.type = 'text/javascript';
            cachedScriptLoader.innerHTML = loadCachedAsync;

            return $(bootstrap).add(cachedScriptLoader);
        } else {
            // return synchronous bootstrap and scripts
            if (uncached.length > 0) {
                // use web service to load all uncached items
                bootstrap.src = getComboStoreURL(uncached);
            } else {
                // when all items are cached, ensure cache is loaded and ready to go
                bootstrap.innerHTML = 'Mobify.combo.loadCache();';
            }

            $scripts = $(bootstrap).add($scripts);
            return $scripts;
        }
    }

  // Combo defaults.
  , defaults = {
        selector: 'script'
      , attribute: 'x-src'
      , endpoint: '//combo.mobify.com/jsonp/'
      , loadSyncCallback: 'Mobify.combo.loadSync'
      , storeCallback: 'Mobify.combo.store'
      , storeAndLoadAsyncCallback: 'Mobify.combo.storeAndLoadAsync'
      , loadAsyncCallback: 'Mobify.combo.loadAsync'
    };

// ##
// # CSS REWRITING SERVICE CLIENT FUNCTIONS
// ##

// Endpoint host
var cssHost = 'combo.mobify.com'
    /**
     * Get the CSS rewriting service URL for the request corresponding to 
     * the given object.
     */
  , cssURL = Mobify.cssURL = function(object) {
        return '//' + cssHost + '/css/' + JSONURIencode(object);
    };

})(Mobify);
