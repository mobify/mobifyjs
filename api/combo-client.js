(function(Mobify) {

var caching = Mobify.httpCaching

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
        urls = caching.notCachedUrls(urls);
        return defaults.endpoint + defaults.storeCallback + '/' + JSONURIencode(urls);
    }
    
  , getComboStoreandLoadAsyncURL = function(urls) {
        return defaults.endpoint + defaults.storeAndLoadAsyncCallback + '/' + JSONURIencode(urls);
    }

    /**
     * Prepare to make combo requests by rehydrating the cache, if there is one 
     * and getting rid of stale items.
     */
    // rehydrate, evict stale items and save back the (potentially smaller) 
    // cache to localStorage
    // Note, after this a "live copy" of the cache still exists at 
    // window.Mobify.combo.resources until "the flood"
  , initializeFromCache = function() {
        combo.rehydrateCache();
        caching.evictStale();
        combo.dehydrateCache();
    }

    /**
     * Searches the collection for scripts and modifies them to use the `combo`
     * service. Returns a collection suitable for use with document.write.
     */
  , comboScriptSync = $.fn.comboScriptSync = function() {
        var $scripts = this.filter(defaults.selector).add(this.find(defaults.selector)).remove()
          , urls = []
          , url
          , bootstrap;

        $scripts.filter('[' + defaults.attribute + ']').each(function() {
            absolutify.href = this.getAttribute(defaults.attribute);
            url = absolutify.href;
            urls.push(url);

            this.removeAttribute(defaults.attribute);

            this.className += ' x-combo';

            this.innerHTML = defaults.loadSyncCallback + "('" + url + "');";
        });

        bootstrap = document.createElement('script');
        bootstrap.src = getComboStoreURL(urls);

        $scripts = $(bootstrap).add($scripts);
        return $scripts;
    }

  , comboScriptAsync = $.fn.comboScriptAsync = function() {
        var $scripts = this.filter(defaults.selector).add(this.find(defaults.selector)).remove();
        var url, urls, uncached, cached, $loaders;

        // Collect up urls
        $scripts.filter('[' + defaults.attribute + ']').each( function() {
            absolutify.href = this.getAttribute(defaults.attribute);
            url = absolutify.href;
            urls.push(url);
        });

        /* Build a script tag that gets the uncached scripts, stores them and then 
           loads/executes them asynchronously */
        uncached = caching.notCachedUrls(urls);
        var resourceLoader = document.createElement('SCRIPT');
        resourceLoader.src = getComboStoreandLoadAsyncURL(uncached);

        /* Build a second script tag that will be inline, and cause the cached 
           scripts to be laoded/executed asynchronously */
        cached = caching.cachedUrls(urls);
        var loadCachedAsync = '';
        for(var i = 0; i < cached.length; i++) {
            cachedScriptloaderText += defaults.loadAsyncCallback + 
            "('" + cached[i] + "');\n";
        }

        var cachedScriptLoader = document.createElement('SCRIPT');
        cachedScriptLoader.type = 'text/javascript';
        cachedScriptLoader.innerText = loadCachedAsync;

        return $(resourceLoader).add(cachedScriptLoader);
    }

    // Combo defaults.
  , defaults = combo.defaults = {
        selector: 'script'
      , attribute: 'x-src'
      //, endpoint: '//jazzcat01.mobify.com/jsonp/'
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