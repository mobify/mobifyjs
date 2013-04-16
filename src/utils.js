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

Utils.removeBySelector = function(selector, doc) {
    var doc = doc || document;

    var els = doc.querySelectorAll(selector);
    for (var i=0,ii=els.length; i<ii; i++) {
        var el = els[i];
        el.parentNode.removeChild(el);
    }
    return els;
}

return Utils;

});