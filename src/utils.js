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

Utils.excludesFilter = function(obj, excludes) {

    // if elements are an array of dom elements
    var elements = obj;
    return [].filter.call(elements, function(el){
        if (el.nodeName === "SCRIPT") {
            var str = el.outerHTML || Utils.outerHTML(el);
        }
        else if (el.nodeName === "IMG") {
            var str = el.getAttribute("x-src");
        }
        // DO THE STRING COMPARISON STUFF
    })

    // if elements are
}

return Utils;

});