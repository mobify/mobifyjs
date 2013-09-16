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

Utils.clone = function(obj) {
    var target = {};
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          target[i] = obj[i];
        }
    }
    return target;
};

// Some url helpers
/**
 * Takes a url, relative or absolute, and absolutizes it relative to the current 
 * document's location/base, with the assistance of an a element.
 */
var _absolutifyAnchor = document.createElement("a");
Utils.absolutify = function(url) {
    _absolutifyAnchor.href = url;
    return _absolutifyAnchor.href;
};

/**
 * Takes an absolute url, returns true if it is an http/s url, false otherwise 
 * (e.g. mailto:, gopher://, data:, etc.)
 */
var _httpUrlRE = /^https?/;
Utils.httpUrl = function(url) {
    return _httpUrlRE.test(url);
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
};

Utils.removeBySelector = function(selector, doc) {
    doc = doc || document;

    var els = doc.querySelectorAll(selector);
    return Utils.removeElements(els, doc);
};

Utils.removeElements = function(elements, doc) {
    doc = doc || document;

    for (var i=0,ii=elements.length; i<ii; i++) {
        var el = elements[i];
        el.parentNode.removeChild(el);
    }
    return elements;
};

// localStorage detection as seen in such great libraries as Modernizr
// https://github.com/Modernizr/Modernizr/blob/master/feature-detects/storage/localstorage.js
// Exposing on Jazzcat for use in qunit tests
var cachedLocalStorageSupport;
Utils.supportsLocalStorage = function() {
    if (cachedLocalStorageSupport !== undefined) {
        return cachedLocalStorageSupport;
    }
    var mod = 'modernizr';
    try {
        localStorage.setItem(mod, mod);
        localStorage.removeItem(mod);
        cachedLocalStorageSupport = true;
    } catch(e) {
        cachedLocalStorageSupport = false
    }
    return cachedLocalStorageSupport;
};

// matchMedia polyfill generator
// (allows you to specify which document to run polyfill on)
Utils.matchMedia = function(doc) {
    "use strict";

    var bool,
        docElem = doc.documentElement,
        refNode = docElem.firstElementChild || docElem.firstChild,
        // fakeBody required for <FF4 when executed in <head>
        fakeBody = doc.createElement("body"),
        div = doc.createElement("div");

    div.id = "mq-test-1";
    div.style.cssText = "position:absolute;top:-100em";
    fakeBody.style.background = "none";
    fakeBody.appendChild(div);

    return function(q){
        div.innerHTML = "&shy;<style media=\"" + q + "\"> #mq-test-1 { width: 42px; }</style>";

        docElem.insertBefore(fakeBody, refNode);
        bool = div.offsetWidth === 42;
        docElem.removeChild(fakeBody);

        return {
           matches: bool,
           media: q
        };
    };
};

// readyState: loading --> interactive --> complete
//                      |               |
//                      |               |
//                      v               v
// Event:        DOMContentLoaded    onload
//
// iOS 4.3 and some Android 2.X.X have a non-typical "loaded" readyState,
// which is an acceptable readyState to start capturing on, because
// the data is fully loaded from the server at that state.
// For some IE (IE10 on Lumia 920 for example), interactive is not 
// indicative of the DOM being ready, therefore "complete" is the only acceptable
// readyState for IE10
// Credit to https://github.com/jquery/jquery/commit/0f553ed0ca0c50c5f66377e9f2c6314f822e8f25
// for the IE10 fix
Utils.domIsReady = function(doc) {
    var doc = doc || document;
    return doc.attachEvent ? doc.readyState === "complete" : doc.readyState !== "loading";
}

return Utils;

});