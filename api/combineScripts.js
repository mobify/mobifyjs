/**
 * combineScripts: Clientside API to the combo service.
 */

define(["./mobifyjs", "./httpCache"], function(Mobify, httpCache) {

var $ = Mobify.$ || window.$ || { fn: {}}

  , absolutify = document.createElement('a')

  , combineScripts = function($scripts) {
        // Fastfail if there are no scripts or if required modules are missing.
        if (!$scripts.length || !window.localStorage || !window.JSON) {
            return $scripts;
        }

        httpCache.load();

        [].forEach.call($scripts, function(script) {
            var isCached,
                url = script.getAttribute(defaults.attribute);
            if (!url || (script.tagName !== "SCRIPT")) return;
            
            absolutify.href = url;
            url = absolutify.href;

            script.removeAttribute(defaults.attribute);
            isCached = !!httpCache.get(url);
            script.innerHTML = isCached + ',' + defaults.execCallback + "('" + url + "');";
        });

        return $scripts;
    }

  , defaults = combineScripts.defaults = {
        selector: 'script'
      , attribute: 'x-src'
      , endpoint: '//jazzcat.mobify.com/jsonp/'
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
            
            // Firefox will choke on closing script tags passed through
            // the ark.
            document.write('<script src="' + url + '"><\/scr' + 'ipt>');
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
  , getURL = function(urls, callback) {
        return defaults.endpoint + callback + '/' + JSONURIencode(urls.slice().sort());
    }

  , JSONURIencode = Mobify.JSONURIencode = function(obj) {
        return encodeURIComponent(JSON.stringify(obj));
    };


var oldEnable = Mobify.externals.enable;
var enablingRe = new RegExp("<script[\\s\\S]*?>false,"
  + defaults.execCallback.replace('.', '\\.')
  + "\\('([\\s\\S]*?)'\\);<\\/script", "gi");

Mobify.externals.enable = function() {
    var match
      , bootstrap
      , firstIndex = -1
      , uncached = []
      , htmlStr = oldEnable.apply(Mobify.externals, arguments);

    while (match = enablingRe.exec(htmlStr)) {
        if (!~firstIndex) firstIndex = match.index;
        uncached.push(match[1]);
    }
    if (!~firstIndex) return htmlStr;
    
    bootstrap = document.createElement('script')
    if (uncached.length) {
        bootstrap.src = getURL(uncached, defaults.loadCallback);
    } else {
        bootstrap.innerHTML = defaults.loadCallback + '();';
    }

    return htmlStr.substr(0, firstIndex) + bootstrap.outerHTML + htmlStr.substr(firstIndex);
};

$.fn.combineScripts = function() {
    return combineScripts.call(window, this)
}

Mobify.cssURL = function(obj) {
    return '//combo.mobify.com/css/' + JSONURIencode(obj)
}

return combineScripts;

});