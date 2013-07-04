define(["jazzcat"], function(Jazzcat) {
    var Prefetch = window.Prefetch = {};

    var hostEndpoint = '//prefsy.herokuapp.com'
    var fetchEndpoint = hostEndpoint + '/jsinject';
    var analyticsEndpoint = hostEndpoint + '/jscollect';
    var loadCallback = 'Prefetch.loadScripts';


    Prefetch.gatherAnalytics = function(){
        result = {
            "pageUrl": window.location.host,
            "resources": []
        };

        scripts = document.querySelectorAll('script[src]');

        var absolutify = document.createElement('a');
        Array.prototype.slice.call(scripts).forEach(function(script, index){
            absolutify.href = script.src;
            result['resources'].push(absolutify.href);   
        });

        var xhr = new XMLHttpRequest();
        xhr.open('POST', analyticsEndpoint, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.onload = function () {
            console.log(this.responseText);
        };
        xhr.send(JSON.stringify(result));

    };

    Prefetch.insertLoader = function(url) {
        var script = document.createElement('script');
        script.async = true;
        script.src = url;
        document.getElementsByTagName('head')[0].appendChild(script);
    };

    Prefetch.prefetchScripts = function() {
        var fetchUrl = fetchEndpoint + '?callback=' + loadCallback + '&url=' + encodeURI(location.href);
        Prefetch.insertLoader(fetchUrl);
        //Prefetch.gatherAnalytics();
    };

    Prefetch.loadScripts = function(urls) {
        // TODO: Might not want to load here...
        //Jazzcat.httpCache.load();
        var i = 0, uncached = [], url;
        while (url = urls[i++]) {
            if (!Jazzcat.httpCache.get(url)) {
                uncached.push(url);
            }
        }
        var jazzcatLoaderScript = Jazzcat.getLoaderScripts(uncached, 'Jazzcat.combo.load', false);
        jazzcatLoaderScript.async = true;
        if (jazzcatLoaderScript[1]) {
            document.getElementsByTagName('head')[0].appendChild(jazzcatLoaderScript[1]);
        }
    };

    return Prefetch;
});