(function(window) {

/**
 * A simple fucntional wrapper around the URLPattern Contructor and match methods 
 * for matching routes in Mobify.js
 */
Mobify.urlmatch = function(patternObj) {
    return function() {
        var pattern = Mobify.UrlPattern.fromObject(patternObj);
        return pattern.matches(window.location) ? pattern : false;
    }
}

})(this);