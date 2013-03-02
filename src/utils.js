define([], function() {

// ##
// # Utility methods
// ##

var Utils = {};

Utils.extend = function(target){
    [].slice.call(arguments, 1).forEach(function(source) {
        for (var key in source)
            if (source[key] !== undefined)
                target[key] = source[key];
    }); 
    return target;
};

Utils.keys = function(obj) {
    var result = []; 
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            result.push(key);
    }   
    return result;
};  

Utils.values = function(obj) {
    var result = []; 
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
          result.push(obj[key]);
    }   
    return result;
};

/**
 * outerHTML polyfill - https://gist.github.com/889005
 */
Utils.outerHTML = function(el){
    var div = document.createElement('div');
    div.appendChild(el.cloneNode(true));
    var contents = div.innerHTML;
    div = null;
    return contents;
}

Utils.removeElementFilter = function(elements, excludes, srcAttr) {
    var srcAttr = srcAttr || "x-src";
    return [].filter.call(elements, function(el){
        // Grab the correct string we want to do comparisons against
        if (el.nodeName === "SCRIPT" && !el.hasAttribute(srcAttr)) {
            var str = el.innerHTML; // maybe grab innerText/textContent
        }
        else if (el.nodeName === "IMG" || (el.nodeName === "SCRIPT" && el.hasAttribute(srcAttr))) {
            var str = el.getAttribute(srcAttr);
        }
        // Iterate through the excludes
        for (var i=0; i<excludes.length; i++) {
            var filter = false;
            var exclude = excludes[i];
            if ((exclude.matchType === "startswith" && str.indexOf(exclude.match) == 0) || 
                (exclude.matchType === "contains" && str.indexOf(exclude.match) != -1) ||
                (exclude.matchType === "endswith" && str.indexOf(exclude.match, str.length - exclude.match.length) !== -1) ||
                (exclude.matchType === "regex" && (new RegExp(exclude.match)).test(str))) {

                filter = true;
            }
            if (filter == exclude.does) return false;
        }
        return true; 
    })
}

Utils.removeBySelector = function(selector) {
    var els = capturedDoc.querySelectorAll(selector);
    for (var i=0,ii=els.length; i<ii; i++) {
        var el = els[i];
        el.parentNode.removeChild(el);
    }
}

return Utils;

});