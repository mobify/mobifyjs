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

Utils.elementFilter = function(obj, excludes, prefix) {
    if (!prefix) var prefix = "x-";
    // if elements are an array of dom elements
    var elements = obj;
    var srcAttr = prefix + "src";
    return [].filter.call(elements, function(el){
        if (el.nodeName === "SCRIPT") {
            var str = el.outerHTML || Utils.outerHTML(el);
        }
        else if (el.nodeName === "IMG") {
            var str = el.getAttribute(srcAttr);
        }
        // DO THE STRING COMPARISON STUFF
        [].forEach.call(excludes, function(exclude){
            var filter = false;
            if (exclude.matchType === "contains" && str.indexOf(exclude.match) == 0) {
                filter = true;
            }
            /*
            else if (exclude.matchType === "startswith") {

            }
            else if (exclude.matchType === "endswith") {
                
            }
            else if (exclude.matchType === "regex") {
                
            }
            */
            if (filter == exclude.does) return false;
        })
        return true; 
    })

    // if elements are
}

return Utils;

});