/**
 * Exposes the `Mobify.urlmatch`.
 */
(function() {

/**
 * Returns an escaped  string that when passed to the regular expression 
 * contructor will match the literal contents of the string.
 */
var reEscape = function (str) {
    return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
}; 

var declareUrlMatch = function(window, Mobify) {
    /**
     * Given a a path expression `expr`, returns a RegExp that can be
     * used to match a URL's path.
     */
    var getExpressionRegExp = function(expr) {
        var SLASH = '/';
        var WILD = '*';
        var WILD_RE_STR = '.*';
        var SLASH_RE_STR = '\\/?';

        var bits = expr.slice(1).split(SLASH);
        var reStr = '';

        while (bits.length) {
            bit = bits.pop();
            bit = (bit == WILD ? WILD_RE_STR : reEscape(bit));
            reStr = SLASH_RE_STR + bit + reStr;

            WILD_RE_STR = '[^\/]+';
            SLASH_RE_STR = '\\/';
        };

        var re = new RegExp("^" + reStr + "$", "i");
        return re;
    };

    /**
     * Given a path expression `expr`, or a regular expression, returns a 
     * function that can be used to match against the current window's path, 
     * `window.location.pathname`.
     */
    var urlmatch = function(expr) {
        var exprIsRegExp, exprIsString, re;
        
        exprIsRegExp = expr instanceof RegExp;
        exprIsString = (typeof expr === 'string');
        
        if (!(exprIsRegExp || exprIsString)) {
            return false;
        }
        if (exprIsRegExp) {
            re = expr;
        } else { 
            re = getExpressionRegExp(expr);
        }
        return function() {
            // Note, window is the closed-overarguemnt to the parent function, 
            // not necessarily the global window
            return re.test(window.location.pathname) ? expr : false;
        };
    };

    /* 
    * Set a new object with a location property for the urlmatch function to be 
    * used in place window.
    */
    urlmatch.setWindow = function (newWindow) {
        // change closed over window
        window = newWindow;
    }

    return urlmatch;
};

// Conditional loading using `define`, or adding to `Mobify`.
if ((typeof define !== "undefined" && define !== null) && 'function' === typeof define) {
    define([], function() {
        return declareUrlMatch;
    });
}
if ((typeof Mobify !== "undefined" && Mobify !== null) && 'object' === typeof Mobify &&
  Mobify.urlmatch === undefined) {
    Mobify.urlmatch = declareUrlMatch(window, Mobify);
}

})();