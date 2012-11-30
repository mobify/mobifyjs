/**
 * Exposes the `Mobify.urlmatch`.
 */
(function() {

/**
 * Returns an escaped string that when passed to the regular expression
 * contructor will match the literal contents of the string.
 */
var reEscape = function (str) {
    return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};

var declareUrlMatch = function(window, Mobify) {

    /**
     * Given a a path expression `expr`, returns a RegExp that can be
     * used to match a URL's path.
     */
    var getExpressionRegExp = function(expr) {
        if (expr == "/*") {
            return /.*/;
        }

        // #    Expr    Split               RE
        // A    /       [""]                /^\/+$/
        // B    /*/     ["", "*", ""]       /^\/+[^\/]+\/*$/
        // C    /a/     ["", "a", ""]       /^\/+a\/*$/
        // D    /a      ["", "a"]           /^\/+a\/*$/
        // E    /a/*    ["", "a", "*"]      /^\/+a\/+.+$/
        // F    /a/b    ["", "a", "b"]      /^\/+a\/+b\/*$/
        // G    /a/b/   ["", "a", "b", ""]  /^\/+a\/+b\/*$/
        // H    /a/b/*  ["", "a", "b", "*"] /^\/+a\/+b\/+.+$/

        var EMPTY = "";
        var WILD = "*";
        // Merge slashes.
        var SLASH = "\\/+";

        var bits = expr.slice(1).split("/");
        var reStr = EMPTY;
        var bit;

        while (bits.length) {
            bit = bits.shift();
            if (bits.length) {
                reStr += SLASH + ((bit == WILD) ? "[^\\/]+" : reEscape(bit));
            } else {
                // E
                if (bit == WILD) {
                    reStr += ".+"
                } else {
                    // D
                    if (bit != EMPTY) {
                        reStr += SLASH + reEscape(bit)
                    }
                    reStr += '\\/*';
                }
            }
        }

        var re = RegExp("^" + reStr + "$", "i");
        return re
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

    /**
     * Allow the local variable `window` to be overridden. Useful for testing.
     */
    urlmatch.setWindow = function (newWindow) {
        window = newWindow;
    };

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