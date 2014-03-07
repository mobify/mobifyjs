(function () {/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('mobifyjs/utils',[], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Utils = factory();
    }
}(this, function () {

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
    if (el.outerHTML) {
        return el.outerHTML;
    }
    else {
        var div = document.createElement('div');
        div.appendChild(el.cloneNode(true));
        var contents = div.innerHTML;
        div = null;
        return contents;
    }
};

/**
 * Return a string for the doctype of the current document.
 */
Utils.getDoctype = function(doc) {
    doc = doc || document;
    var doctypeEl = doc.doctype || [].filter.call(doc.childNodes, function(el) {
            return el.nodeType == Node.DOCUMENT_TYPE_NODE
        })[0];

    if (!doctypeEl) return '';

    return '<!DOCTYPE HTML'
        + (doctypeEl.publicId ? ' PUBLIC "' + doctypeEl.publicId + '"' : '')
        + (doctypeEl.systemId ? ' "' + doctypeEl.systemId + '"' : '')
        + '>';
};

/**
 * Returns an object that represents the parsed content attribute of the
 * viewport meta tag. Returns false if no viewport meta tag is present.
 */
Utils.getMetaViewportProperties = function(doc) {
    // Regex to split comma-delimited viewport meta tag properties
    var SPLIT_PROPERTIES_REGEX = /,\s?/;

    doc = doc || document;
    var parsedProperties = {}

    // Get the viewport meta tag
    var viewport = doc.querySelectorAll('meta[name="viewport"]');
    if (viewport.length == 0) {
        return false;
    }

    // Split its properties
    var content = viewport[0].getAttribute('content');
    if (content == null) {
        return false;
    }
    var properties = content.split(SPLIT_PROPERTIES_REGEX);

    // Parse the properties into an object
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i].split('=')

        if (property.length >= 2) {
            var key = property[0];
            var value = property[1];
            parsedProperties[key] = value;
        }
    }

    return parsedProperties;
}

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
};

Utils.getPhysicalScreenSize = function(devicePixelRatio) {

    function multiplyByPixelRatio(sizes) {
        var dpr = devicePixelRatio || window.devicePixelRatio || 1;

        sizes.width = Math.round(sizes.width * dpr);
        sizes.height = Math.round(sizes.height * dpr);

        return sizes;
    }

    var iOS = navigator.userAgent.match(/ip(hone|od|ad)/i);
    var androidVersion = (navigator.userAgent.match(/android (\d)/i) || {})[1];

    var sizes = {
        width: window.outerWidth
      , height: window.outerHeight
    };

    // Old Android and BB10 use physical pixels in outerWidth/Height, which is what we need
    // New Android (4.0 and above) use CSS pixels, requiring devicePixelRatio multiplication
    // iOS lies about outerWidth/Height when zooming, but does expose CSS pixels in screen.width/height

    if (!iOS) {
        if (androidVersion > 3) return multiplyByPixelRatio(sizes);
        return sizes;
    }

    var isLandscape = window.orientation % 180;
    if (isLandscape) {
        sizes.height = screen.width;
        sizes.width = screen.height;
    } else {
        sizes.width = screen.width;
        sizes.height = screen.height;
    }

    return multiplyByPixelRatio(sizes);
};

Utils.waitForReady = function(doc, callback) {
    // Waits for `doc` to be ready, and then fires callback, passing
    // `doc`.

    // We may be in "loading" state by the time we get here, meaning we are
    // not ready to capture. Next step after "loading" is "interactive",
    // which is a valid state to start capturing on (except IE), and thus when ready
    // state changes once, we know we are good to start capturing.
    // Cannot rely on using DOMContentLoaded because this event prematurely fires
    // for some IE10s.
    var ready = false;
    
    var onReady = function() {
        if (!ready) {
            ready = true;
            iid && clearInterval(iid);
            callback(doc);
        }
    }

    // Backup with polling incase readystatechange doesn't fire
    // (happens with some Android 2.3 browsers)
    var iid = setInterval(function(){
        if (Utils.domIsReady(doc)) {
            onReady();
        }
    }, 100);

    doc.addEventListener("readystatechange", onReady, false);
};

return Utils;

}));

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('mobifyjs/resizeImages',['mobifyjs/utils'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('../mobifyjs-utils/utils.js'));
    } else {
        // Browser globals (root is window)
        root.ResizeImages = factory(root.Utils);
    }
}(this, function (Utils) {

var ResizeImages = window.ResizeImages = {};

var localStorageWebpKey = 'Mobify-Webp-Support-v2';

function persistWebpSupport(supported) {
    if (Utils.supportsLocalStorage()) {
        var webpSupport = {
            supported: supported,
            date: Date.now()
        };
        localStorage.setItem(localStorageWebpKey, JSON.stringify(webpSupport));
    }
}

/**
 * Synchronous WEBP detection using regular expressions
 * Credit to Ilya Grigorik for WEBP regex matching
 * https://github.com/igrigorik/webp-detect/blob/master/pagespeed.cc
 * Modified to exclude Android native browser on Android 4
 */
ResizeImages.userAgentWebpDetect = function(userAgent){
    var supportedRe = /(Android\s|Chrome\/|Opera9.8*Version\/..\.|Opera..\.)/i;
    var unsupportedVersionsRe = new RegExp('(Android\\s(0|1|2|3|(4(?!.*Chrome)))\\.)|(Chrome\\/[0-8]\\.)' +
                                '|(Chrome\\/9\\.0\\.)|(Chrome\\/1[4-6]\\.)|(Android\\sChrome\\/1.\\.)' +
                                '|(Android\\sChrome\\/20\\.)|(Chrome\\/(1.|20|21|22)\\.)' +
                                '|(Opera.*(Version/|Opera\\s)(10|11)\\.)', 'i');

    // Return false if browser is not supported
    if (!supportedRe.test(userAgent)) {
        return false;
    }

    // Return false if a specific browser version is not supported
    if (unsupportedVersionsRe.test(userAgent)) {
        return false;
    }
    return true;
};

/**
 * Asychronous WEB detection using a data uri.
 * Credit to Modernizer:
 * https://github.com/Modernizr/Modernizr/blob/fb76d75fbf97f715e666b55b8aa04e43ef809f5e/feature-detects/img-webp.js
 */
ResizeImages.dataUriWebpDetect = function(callback) {
    var image = new Image();
    image.onload = function() {
        var support = (image.width === 1) ? true : false;
        persistWebpSupport(support);
        if (callback) callback(support);
        };
    // this webp generated with Mobify image resizer from 
    // http://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png passed 
    // through the Mobify Image resizer: 
    // http://ir0.mobify.com/webp/http://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png
    image.src = 'data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQABgBwlpAADcAD+/gbQAA==';
}

/**
 * Detect WEBP support sync and async. Do our best to determine support
 * with regex, and use data-uri method for future proofing.
 * (note: async test will not complete before first run of `resize`,
 * since onload of detector image won't fire until document is complete)
 * Also caches results for WEBP support in localStorage.
 */
ResizeImages.supportsWebp = function(callback) {

    // Return early if we have persisted WEBP support
    if (Utils.supportsLocalStorage()) {
        
        // Check if WEBP support has already been detected
        var webpSupport;
        var storedSupport = localStorage.getItem(localStorageWebpKey);

        // Only JSON.parse if storedSupport is not null, or else things
        // will break on Android 2.3
        storedSupport && (webpSupport = JSON.parse(storedSupport));
        
        // Grab previously cached support value in localStorage.
        if (webpSupport && (Date.now() - webpSupport.date < 604800000)) {
            return webpSupport.supported;
        }
    }

    // Run async WEBP detection for future proofing
    // This test may not finish running before the first call of `resize`
    ResizeImages.dataUriWebpDetect(callback);

    // Run regex based synchronous WEBP detection
    var support = ResizeImages.userAgentWebpDetect(navigator.userAgent);

    persistWebpSupport(support);

    return support;

};

/**
 * Returns a URL suitable for use with the 'ir' service.
 */
ResizeImages.getImageURL = function(url, options) {
    var opts = options;
    if (!opts) {
        opts = ResizeImages.processOptions();
    }
    var bits = [opts.proto + opts.host];

    if (opts.projectName) {
        var projectId = "project-" + opts.projectName;
        bits.push(projectId);
    }

    if (opts.cacheHours) {
        bits.push('c' + opts.cacheHours);
    }

    if (opts.format) {
        bits.push(opts.format + (opts.quality || ''));
    } else if (opts.quality) {
        bits.push('q' + opts.quality);
    }

    if (opts.maxWidth) {
        bits.push(opts.maxWidth);

        if (opts.maxHeight) {
            bits.push(opts.maxHeight);
        }
    }

    bits.push(url);
    return bits.join('/');
};

/**
 * Replaces src attr of passed element with value of running `getImageUrl` on it
 * Allows overriding of img.getAttribute(x-src) with srcVal
 */

ResizeImages._rewriteSrcAttribute = function(element, opts, srcVal){
    srcVal = element.getAttribute(opts.sourceAttribute) || srcVal;
    if (srcVal) {
        var url = Utils.absolutify(srcVal);
        if (Utils.httpUrl(url)) {
            if (opts.onerror) {
                element.setAttribute('onerror', opts.onerror);
            }
            element.setAttribute(opts.targetAttribute, ResizeImages.getImageURL(url, opts));
            element.setAttribute('data-orig-src', srcVal);
            // if using resize when not capturing, remove the sourceAttribute
            // as long as it's not "src", which is the target attribute used
            // when not capturing.
            if (!capturing && opts.sourceAttribute != opts.targetAttribute) {
                element.removeAttribute(opts.sourceAttribute);
            }
        }
    }
};

/**
 * Modifies src of `<source />` children of a `<picture>` element to use image 
 * resizer
 */
ResizeImages._resizeSourceElement = function(element, opts, rootSrc) {
    // Grab optional width override
    var width = element.getAttribute('data-width');
    var localOpts = opts;
    if (width) {
        localOpts = Utils.clone(opts);
        localOpts.maxWidth = width;
    }
    // pass along rootSrc if defined on `picture` element
    ResizeImages._rewriteSrcAttribute(element, localOpts, rootSrc);
};

/**
 * Takes a picture element and calls _resizeSourceElement on its `<source />` 
 * children
 */
ResizeImages._crawlPictureElement = function(el, opts) {
    var sources = el.getElementsByTagName('source');
    // If source elements are erased from the dom, leave the
    // picture element alone.
    if (sources.length === 0 || el.hasAttribute('mobify-optimized')) {
        return;
    }
    el.setAttribute('mobify-optimized', '');

    // Grab optional `data-src` attribute on `picture`.
    // Used for preventing writing the same src multiple times for
    // different `source` elements.
    var rootSrc = el.getAttribute('data-src');

    // resize the sources
    for(var i =  0, len = sources.length; i < len; i++) {
        ResizeImages._resizeSourceElement(sources[i], opts, rootSrc);
    }
};

/**
 * Searches a list of target dimensions for the smallest one that is greater than 
 * the passed value and return it, or return the greatst value if none are 
 * greater.
 *
 * Popular device resolutions: 
 * iPhone 3Gs - 320x480
 * iPhone 4 - 640x960
 * iPhone 5 - 650x1156
 * 
 * Galaxy SIII/Nexus 4/Nexus 7 - 720x1280
 * Galaxy SIV/Nexus 5 - 1080x1920
 * 
 * iPad (non-retina) - 1024x768
 * iPad (retina) - 2048x1536
 *
 * A larger list of target dimensions would include 720px, 800px, 1024px, 1280px 
 * and 1920px but they have been omitted due tot heir proximity to other, larger 
 * values
 */
var targetDims = [320, 640, 768, 1080, 1536, 2048, 4000];
ResizeImages._getBinnedDimension = function(dim) {
    var resultDim = 0;

    for (var i = 0, len = targetDims.length; i < len; i++) {
        resultDim = targetDims[i];
        if (resultDim >= dim) {
            break;
        }
    }
    return resultDim;
};

/**
 * Returns a boolean that indicates whether images should be resized.
 * Looks for the viewport meta tag and parses it to determine whether the
 * website is responsive (the viewport is set to the device's width). This
 * ensures that images that are part of a larger viewport are not scaled.
 */
ResizeImages._shouldResize = function(document) {
    var metaViewport = Utils.getMetaViewportProperties(document);
    if (!metaViewport) {
        return false;
    }

    // It's complicated, but what we want to know is whether the viewport
    // matches the 'ideal viewport'. If either `initial-scale` is 1 or `width`
    // is device-width or both, then the viewport will match the 'ideal
    // viewport'. There are a few other special circumstances under which the
    // viewport could be ideal, but we can't test for them.
    //
    // See: http://www.quirksmode.org/mobile/metaviewport/

    // Ideal viewport when width=device-width
    if (!metaViewport['initial-scale'] && metaViewport['width']) {
        return metaViewport['width'] == 'device-width';
    }

    // Ideal viewport when initial-scale=1
    if (!metaViewport['width'] && metaViewport['initial-scale']) {
        return metaViewport['initial-scale'] == '1';
    }

    // Ideal viewport when width=device-width and the intial-scale is 1 or more
    // (in that case it's just zoomed)
    if (metaViewport['width'] && metaViewport['initial-scale']) {
        initialScale = parseInt(metaViewport['initial-scale']);
        return initialScale >= 1 && metaViewport['width'] == 'device-width';
    }

    return false
};

/**
 * Processes options passed to `resize()`. Takes an options object that 
 * potentially has height and width set in css pixels, returns an object where 
 * they are expressed in device pixels, and other default options are set.
 */
ResizeImages.processOptions = function(options) {    
    var opts = Utils.clone(ResizeImages.defaults);
    if (options) {
        Utils.extend(opts, options);
    }

    // A null value for `resize` triggers the auto detect functionality. This
    // uses the document to determine whether images should be resized and sets
    // it as the new default.
    if (opts.resize == null && options.document) {
        var resize = ResizeImages._shouldResize(options.document);
        ResizeImages.defaults.resize = opts.resize = resize;
    }

    if (!opts.format && opts.webp) {
        opts.format = "webp";
    }

    // Without `resize` images are served through IR without changing their dimensions
    if (!opts.resize) {
        opts.maxWidth = opts.maxHeight = opts.devicePixelRatio = null;
    }
    else {
        var dpr = opts.devicePixelRatio || window.devicePixelRatio;

        var screenSize = Utils.getPhysicalScreenSize(dpr);

        // If maxHeight/maxWidth are not specified, use screen dimensions
        // in device pixels
        var width = opts.maxWidth || ResizeImages._getBinnedDimension(screenSize.width);
        var height = opts.maxHeight || undefined;

        // Otherwise, compute device pixels
        if (dpr && opts.maxWidth) {
            width = width * dpr;
            if (opts.maxHeight) {
                height = height * dpr;
            }
        }

        // round up in case of non-integer device pixel ratios
        opts.maxWidth = Math.ceil(width);
        if (opts.maxHeight && height) {
            opts.maxHeight = Math.ceil(height);
        }
    }

    return opts;
};

/**
 * Searches the collection for image elements and modifies them to use
 * the Image Resize service. Pass `options` to modify how the images are 
 * resized.
 */
ResizeImages.resize = function(elements, options) {
    // Return early if elements is empty
    if (!elements.length) {
        return;
    }

    // Supplement `options` with the document from the first element
    if (options && !options.document) {
        options.document = elements[0].ownerDocument;
    }
    var opts = ResizeImages.processOptions(options);

    for(var i=0; i < elements.length; i++) {
        var element = elements[i];

        // For an `img`, simply modify the src attribute
        if (element.nodeName === 'IMG' && !element.hasAttribute('mobify-optimized')) {
            element.setAttribute('mobify-optimized', '');
            ResizeImages._rewriteSrcAttribute(element, opts);
        }
        // For a `picture`, (potentially) nuke src on `img`, and
        // pass all `source` elements into modifyImages recursively
        else if (element.nodeName === 'PICTURE') {
            ResizeImages._crawlPictureElement(element, opts);
        }
    }

    return elements;
};

ResizeImages.restoreOriginalSrc = function(event) {
    var origSrc;
    event.target.removeAttribute('onerror'); // remove ourselves
    origSrc = event.target.getAttribute('data-orig-src')
    if (origSrc) {
        event.target.setAttribute('src', origSrc);
    }
};

var capturing = window.Mobify && window.Mobify.capturing || false;

ResizeImages.defaults = {
      proto: '//',
      host: 'ir0.mobify.com',
      projectName: "oss-" + location.hostname.replace(/[^\w]/g, '-'),
      sourceAttribute: "x-src",
      targetAttribute: (capturing ? "x-src" : "src"),
      webp: ResizeImages.supportsWebp(),
      resize: true,
      onerror: 'ResizeImages.restoreOriginalSrc(event);'
};

return ResizeImages;

}));

/**
 * The Jazzcat client is a library for loading JavaScript from the Jazzcat
 * webservice. Jazzcat provides a JSONP HTTP endpoint for fetching multiple HTTP
 * resources with a single HTTP request. This is handy if you'd to request a
 * number of JavaScript files in a single request.
 *
 * The client is designed to work with Capturing in a "drop in" manner and as such is
 * optimized for loading collections of scripts on a page through Jazzcat,
 * rather than fetching specific scripts.
 *
 * The client cannot rely on the browser's cache to store Jazzcat responses. Imagine
 * page one with external scripts a and b and page two with script a. Visitng
 * page one and then page two results in a cache miss because each set of scripts
 * generate different requests to Jazzcat.
 *
 * To work around this, the client implements a cache over localStorage for caching
 * the results of requests to Jazzcat.
 *
 * Scripts that should use the client must be passed to `Jazzcat.optimizeScripts`
 * during the capturing phase. During execution, uncached scripts are loaded
 * into the cache using a bootloader request to Jazzcat. Scripts are then
 * executed directly from the cache.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('mobifyjs/jazzcat',["mobifyjs/utils"], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        var Utils = require('../mobifyjs-utils/utils.js');
        module.exports = factory(Utils);
    } else {
        // Browser globals (root is window)
        root.Jazzcat = factory(root.Utils);
    }
}(this, function (Utils) {
    /**
     * An HTTP 1.1 compliant localStorage backed cache.
     */
    var httpCache = {
        cache: {},
        options: {},
        utils: {}
    };

    var localStorageKey = 'Mobify-Jazzcat-Cache-v1.0';

    /**
     * Reset the cache, optionally to `val`. Useful for testing.
     */
    httpCache.reset = function(val) {
        httpCache.cache = val || {};
    };

    /**
     * Returns value of `key` if it is in the cache and marks it as used now if 
     * `touch` is true.
     */
    httpCache.get = function(key, touch) {
        // Ignore anchors.
        var resource = httpCache.cache[key.split('#')[0]];
        if (resource && touch) {
            resource.lastUsed = Date.now();
        }
        return resource;
    };

    /**
     * Set `key` to `val` in the cache.
     */
    httpCache.set = function(key, val) {
        httpCache.cache[key] = val;
    };

    /**
     * Load the cache into memory, skipping stale resources.
     */
    httpCache.load = function(options) {
        var data = localStorage.getItem(localStorageKey);
        var key;
        var staleOptions;

        if (options && options.overrideTime !== undefined) {
            staleOptions = {overrideTime: options.overrideTime};
        }

        if (!data) {
            return;
        }

        try {
            data = JSON.parse(data);
        } catch(err) {
            return;
        }
        for (key in data) {
            if (data.hasOwnProperty(key) && !httpCache.utils.isStale(data[key], staleOptions)) {
                httpCache.set(key, data[key]);
            }
        }
    };

    /**
     * Save the in-memory cache to localStorage. If the localStorage is full,
     * use LRU to drop resources until it will fit on disk, or give up after 10
     * attempts.
     */

    // save mutex to prevent multiple concurrent saves and saving before `load` 
    // event for document
    var canSave = true;
    httpCache.save = function(callback) {
        var attempts = 10;
        var resources;
        var key;

        // prevent multiple saves before onload
        if (!canSave) {
            return callback && callback("Save currently in progress");
        }
        canSave = false;

        // Serialize the cache for storage. If the serialized data won't fit,
        // evict an item and try again. Use `setTimeout` to ensure the UI stays
        // responsive even if a number of resources are evicted.
        (function persist() {
            var store = function() {
                var resource;
                var serialized;
                // End of time.
                var lruTime = 9007199254740991;
                var lruKey;
                resources = resources || Utils.clone(httpCache.cache);
                try {
                    serialized = JSON.stringify(resources);
                } catch(e) {
                    canSave = true;
                    return callback && callback(e);
                }

                try {
                    localStorage.setItem(localStorageKey, serialized);
                // The serialized data won't fit. Remove the least recently used
                // resource and try again.
                } catch(e) {
                    if (!--attempts) {
                        canSave = true;
                        return callback && callback(e);
                    }
                    // Find the least recently used resource.
                    for (var key in resources) {
                        if (!resources.hasOwnProperty(key)) continue;
                        resource = resources[key];

                        if (resource.lastUsed) {
                            if (resource.lastUsed <= lruTime) {
                                lruKey = key;
                                lruTime = resource.lastUsed;
                            }
                        // If a resource has not been used, it's the LRU.
                        } else {
                            lruKey = key;
                            lruTime = 0;
                            break;
                        }
                    }
                    delete resources[lruKey];

                    return persist();
                }

                canSave = true;
                callback && callback();
            };
            if (Utils.domIsReady()) {
                store();
            }
            else {
                setTimeout(persist, 15);
            }
        })();
    };

    // Regular expressions for cache-control directives.
    // See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9
    var ccDirectives = /^\s*(public|private|no-cache|no-store)\s*$/;
    var ccMaxAge = /^\s*(max-age)\s*=\s*(\d+)\s*$/;

    /**
     * Returns a parsed HTTP 1.1 Cache-Control directive from a string `directives`.
     */
    httpCache.utils.ccParse = function(directives) {
        var obj = {};
        var match;

        directives.split(',').forEach(function(directive) {
            if (match = ccDirectives.exec(directive)) {
                obj[match[1]] = true;
            } else if (match = ccMaxAge.exec(directive)) {
                obj[match[1]] = parseInt(match[2], 10);
            }
        });

        return obj;
    };

    /**
     * Returns `false` if a response is "fresh" by HTTP/1.1 caching rules or 
     * less than ten minutes old. Treats invalid headers as stale.
     */
    httpCache.utils.isStale = function(resource, options) {
        var ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
        var headers = resource.headers || {};
        var cacheControl = headers['cache-control'];
        var now = Date.now();
        var date = Date.parse(headers['date']);
        var expires;
        var lastModified = headers['last-modified'];
        var age;
        var modifiedAge;
        var overrideTime;

        // Fresh if less than 10 minutes old
        if (date && (now < date + 600 * 1000)) {
            return false;
        }

        // If a cache override parameter is present, see if the age of the 
        // response is less than the override, cacheOverrideTime is in minutes, 
        // turn it off by setting it to false
        if (options && (overrideTime = options.overrideTime) && date) {
            return (now > (date + (overrideTime * 60 * 1000)));
        }

        // If `max-age` and `date` are present, and no other cache
        // directives exist, then we are stale if we are older.
        if (cacheControl && date) {
            cacheControl = httpCache.utils.ccParse(cacheControl);

            if ((cacheControl['max-age']) &&
                (!cacheControl['no-store']) &&
                (!cacheControl['no-cache'])) {
                // Convert the max-age directive to ms.
                return now > (date + (cacheControl['max-age'] * 1000));
            } else {
                // there was no max-age or this was marked no-store or 
                // no-cache, and so is stale
               return true;
            }
        }

        // If `expires` is present, we are stale if we are older.
        if (headers.expires && (expires = Date.parse(headers.expires))) {
            return now > expires;
        }

        // Fresh if less than 10% of difference between date and 
        // last-modified old, up to a day
        if (lastModified && (lastModified = Date.parse(lastModified)) && date) {
            modifiedAge = date - lastModified;
            age = now - date;
            // If the age is less than 10% of the time between the last 
            // modification and the response, and the age is less than a 
            // day, then it is not stale
            if ((age < 0.1 * modifiedAge) && (age < ONE_DAY_IN_MS)) {
                return false;
            }
        }

        // Otherwise, we are stale.
        return true;
    };

    var Jazzcat = window.Jazzcat = {
        httpCache: httpCache,
        // Cache a reference to `document.write` in case it is reassigned.
        write: document.write
    };

    // No support for Firefox <= 11, Opera 11/12, browsers without
    // window.JSON, and browsers without localstorage.
    // All other unsupported browsers filtered by mobify.js tag.
    Jazzcat.isIncompatibleBrowser = function(userAgent) {
        var match = /(firefox)[\/\s](\d+)|(opera[\s\S]*version[\/\s](11|12))/i.exec(userAgent || navigator.userAgent);
        // match[1] == Firefox <= 11, // match[3] == Opera 11|12
        // These browsers have problems with document.write after a document.write
        if ((match && match[1] && +match[2] < 12) || (match && match[3])
             || (!Utils.supportsLocalStorage())
             || (!window.JSON)) {
            return true;
        }

        return false;
    };

    /**
     * Alter the array of scripts, `scripts`, into calls that use the Jazzcat
     * service. Roughly:
     *
     *   Before:
     *
     *   <script src="http://code.jquery.com/jquery.js"></script>
     *   <script>$(function() { alert("helo joe"); })</script>
     *
     *   After:
     *
     *   <script>Jazzcat.httpCache.load();<\/script>
     *   <script src="//jazzcat.mobify.com/jsonp/Jazzcat.load/http%3A%2F%2Fcode.jquery.com%2Fjquery.js"></script>
     *   <script>Jazzcat.exec("http://code.jquery.com/jquery.js")</script>
     *   <script>$(function() { alert("helo joe"); })</script>
     *
     * 
     * Takes an option argument, `options`, an object whose properties define 
     * options that alter jazzcat's javascript loading, caching and execution 
     * behaviour. Right now the options default to `Jazzcat.defaults` which
     * can be overridden. More details on options:
     *
     * - `cacheOverrideTime` :  An integer value greater than 10 that will 
     *                          override the freshness implied by the HTTP 
     *                          caching headers set on the reource.
     * - `responseType` :       This value defaults to `jsonp`, which will
     *                          make a request for a jsonp response which
     *                          loads scripts into the httpCache object.
     *                          Can also specify `js`, which will send back
     *                          a plain JavaScript response, which does not
     *                          use localStorage to manage script caching.
     *                          (warning - `js` responses are currently
     *                          experimental and may have issues with cache
     *                          headers).
     * - `concat`:              A boolean that specifies whether or not script
     *                          requests should be concatenated (split between
     *                          head and body).
     */
    // `loaded` indicates if we have loaded the cached and inserted the loader
    // into the document
    Jazzcat.cacheLoaderInserted = false;
    Jazzcat.optimizeScripts = function(scripts, options) {
        if (options && options.cacheOverrideTime !== undefined) {
            Utils.extend(httpCache.options,
              {overrideTime: options.cacheOverrideTime});
        }

        // A Boolean to control whether the loader is inlined into the document, 
        // or only added to the returned scripts array
        var inlineLoader = true;
        if (options && options.inlineLoader !== undefined) {
            inlineLoader = options.inlineLoader;
        }

        scripts = Array.prototype.slice.call(scripts);

        // Fastfail if there are no scripts or if required features are missing.
        if (!scripts.length || Jazzcat.isIncompatibleBrowser()) {
            return scripts;
        }

        options = Utils.extend({}, Jazzcat.defaults, options || {});
        var jsonp = (options.responseType === 'jsonp');
        var concat = options.concat;

        // helper method for inserting the loader script
        // before the first uncached script in the "uncached" array
        var insertLoaderInContainingElement = function(script, urls) {
            if (script) {
                var loader = Jazzcat.getLoaderScript(urls, options);
                // insert the loader directly before the script
                script.parentNode.insertBefore(loader, script);
            }
        };
        // helper for appending loader script into an array before the 
        // referenced script
        var appendLoaderAndScriptToArray = function(array, script, urls) {
            if (array) {
                var loader  = Jazzcat.getLoaderScript(urls, options);
                array.push(loader);
                array.push(script);
            }
        };

        var url;
        var toConcat = {
            'head': {
                firstScript: undefined,
                urls: []
            },
            'body': {
                firstScript: undefined,
                urls: []
            }
        };

        // an array to accumulate resulting scripts in and later return
        var resultScripts = [];
        /**
        DEBUG
        **/
        // resultScripts.push = function() {
        //     debugger;
        //     Array.prototype.push.apply(this, arguments);
        // };

        for (var i=0, len=scripts.length; i<len; i++) {
            var script = scripts[i];

            // Skip script if it has been optimized already, or if you have a "skip-optimize" class
            if (script.hasAttribute('mobify-optimized') ||
                script.hasAttribute('skip-optimize') ||
                /mobify/i.test(script.className)){
                continue;
            }

            // skip if modifying inline, append to results otherwise
            url = script.getAttribute(options.attribute);
            if (!url) {
                if (inlineLoader) {
                    continue;
                } else {
                    resultScripts.push(script);
                    continue;
                }
            }
            url = Utils.absolutify(url);
            if (!Utils.httpUrl(url)) {
                continue;
            }

            // TODO: Check for async/defer

            // Load what we have in http cache, and insert loader into document 
            // or result array
            if (jsonp && !Jazzcat.cacheLoaderInserted) {
                httpCache.load(httpCache.options);
                var httpLoaderScript = Jazzcat.getHttpCacheLoaderScript(options);
                if (inlineLoader) {
                    script.parentNode.insertBefore(httpLoaderScript, script);
                } else {
                    resultScripts.push(httpLoaderScript);
                }
                // ensure this doesn't happen again for this page load
                Jazzcat.cacheLoaderInserted = true;
            }

            var parent;
            if (inlineLoader) {
                parent = (script.parentNode.nodeName === "HEAD" ? "head" : "body");
            } else {
                // If we're not going to use the inline loader, we'll do 
                // something terrible and put everything into the head bucket
                parent = 'head';
            }

            if (jsonp) {
                // if: the script is not in the cache (or not jsonp), add a loader
                // else: queue for concatenation
                if (!httpCache.get(url)) {
                    if (!concat) {
                        if (inlineLoader) {
                            insertLoaderInContainingElement(script, [url]);
                        } else {
                            appendLoaderAndScriptToArray(resultScripts, script, [url]);
                        }
                    }
                    else {
                        if (toConcat[parent].firstScript === undefined) {
                            toConcat[parent].firstScript = script;
                        }
                        toConcat[parent].urls.push(url);
                    }
                }
                script.type = 'text/mobify-script';
                // Rewriting script to grab contents from our in-memory cache
                // ex. <script>Jazzcat.exec("http://code.jquery.com/jquery.js")</script>
                if (script.hasAttribute('onload')){
                    var onload = script.getAttribute('onload');
                    script.innerHTML =  options.execCallback + "('" + url + "', '" + onload.replace(/'/g, '\\\'') + "');";
                    script.removeAttribute('onload');
                } else {
                    script.innerHTML =  options.execCallback + "('" + url + "');";
                }

                // Remove the src attribute
                script.removeAttribute(options.attribute);
                if(!inlineLoader) {
                    resultScripts.push(script);
                }
            }
            else {
                if (!concat) {
                    var jazzcatUrl = Jazzcat.getURL([url], options);
                    script.setAttribute(options.attribute, jazzcatUrl);
                }
                else {
                    if (toConcat[parent].firstScript === undefined) {
                        toConcat[parent].firstScript = script;
                    }
                    toConcat[parent].urls.push(url);
                }
            }

        }
        // insert the loaders for uncached head and body scripts if
        // using concatenation
        if (concat) {
            if (inlineLoader) {
                insertLoaderInContainingElement(toConcat['head'].firstScript,
                                                toConcat['head'].urls);
                insertLoaderInContainingElement(toConcat['body'].firstScript,
                                                toConcat['body'].urls);
            } else {
                appendLoaderAndScriptToArray(resultScripts,
                                             toConcat['head'].firstScript,
                                             toConcat['head'].urls);
            }
        }

        // if responseType is js and we are concatenating, remove original scripts
        if (!jsonp && concat) {
            for (var i=0, len=scripts.length; i<len; i++) {
                var script = scripts[i];
                // Only remove scripts if they are external
                if (script.getAttribute(options.attribute) && inlineLoader) {
                    script.parentNode.removeChild(script);
                }
            }
        }

        // If the loader was inlined, return the original set of scripts
        if(inlineLoader) {
            return scripts;
        }
        // Otherwise return the generated list
        return resultScripts;
    };

    /**
     * Private helper that returns a script node that when run, loads the 
     * httpCache from localStorage.
     */
    Jazzcat.getHttpCacheLoaderScript = function(options) {
        var loadFromCacheScript = document.createElement('script');
        loadFromCacheScript.type = 'text/mobify-script';
        loadFromCacheScript.innerHTML = (httpCache.options.overrideTime ?
          options.cacheLoadCallback + "(" + JSON.stringify(httpCache.options) + ");" :
          options.cacheLoadCallback + "();" );

        return loadFromCacheScript;
    };

    /**
     * Returns an array of scripts suitable for loading Jazzcat's localStorage 
     * cache and loading any uncached scripts through the jazzcat service. Takes
     * a list of URLs to load via the service (possibly empty), the name of the 
     * jsonp callback used in loading the service's response and a boolean of 
     * whether we expect the cache to have been loaded from localStorage by this 
     * point.
     */
    Jazzcat.getLoaderScript = function(urls, options) {
        var loadScript;
        if (urls && urls.length) {
            loadScript = document.createElement('script');
            // Set the script to "optimized"
            loadScript.setAttribute('mobify-optimized', '');
            loadScript.setAttribute(options.attribute, Jazzcat.getURL(urls, options));
        }
        return loadScript;
    };

    /**
     * Returns a URL suitable for loading `urls` from Jazzcat, calling the
     * function `jsonpCallback` on complete. `urls` are sorted to generate
     * consistent URLs.
     */
    Jazzcat.getURL = function(urls, options) {
        var options = Utils.extend({}, Jazzcat.defaults, options || {});
        return options.base +
               (options.projectName ? '/project-' + options.projectName : '') +
               '/' + options.responseType +
               (options.responseType === 'jsonp' ? '/' + options.loadCallback : '') +
               '/' + encodeURIComponent(JSON.stringify(urls.slice().sort())); // TODO only sort for jsonp
    };

    var scriptSplitRe = /(<\/scr)(ipt\s*>)/ig;

    /**
     * Execute the script at `url` using `document.write`. If the scripts
     * can't be retrieved from the cache, load it using an external script.
     */
    Jazzcat.exec = function(url, onload) {
        var resource = httpCache.get(url, true);
        var out;
        var onloadAttrAndVal = '';
        if (onload) {
            onload = ';' + onload + ';';
            onloadAttrAndVal = ' onload="' + onload + '"';
        } else {
            onload = '';
        }

        if (!resource) {
            out = 'src="' + url + '"' + onloadAttrAndVal + '>';
        } else {
            out = 'data-orig-src="' + url + '"';
            // Explanation below uses [] to stand for <>.
            // Inline scripts appear to work faster than data URIs on many OSes
            // (e.g. Android 2.3.x, iOS 5, likely most of early 2013 device market)
            //
            // However, it is not safe to directly convert a remote script into an
            // inline one. If there is a closing script tag inside the script,
            // the script element will be closed prematurely.
            //
            // To guard against this, we need to prevent script element spillage.
            // This is done by replacing [/script] with [/scr\ipt] inside script
            // content. This transformation renders closing [/script] inert.
            //
            // The transformation is safe. There are three ways for a valid JS file
            // to end up with a [/script] character sequence:
            // * Inside a comment - safe to alter
            // * Inside a string - replacing 'i' with '\i' changes nothing, as
            //   backslash in front of characters that need no escaping is ignored.
            // * Inside a regular expression starting with '/script' - '\i' has no
            //   meaning inside regular expressions, either, so it is treated just
            //   like 'i' when expression is matched.
            //
            // Talk to Roman if you want to know more about this.
            out += '>' + resource.body.replace(scriptSplitRe, '$1\\$2') + onload;
        }

        // `document.write` is used to ensure scripts are executed in order,
        // as opposed to "as fast as possible"
        // http://hsivonen.iki.fi/script-execution/
        // http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
        // This call seems to do nothing in Opera 11/12
        Jazzcat.write.call(document, '<script ' + out +'<\/script>');
    };

    /**
     * Load the cache and populate it with the results of the Jazzcat
     * response `resources`.
     */
    Jazzcat.load = function(resources) {
        var resource;
        var i = 0;
        var save = false;

        // All the resources are already in the cache.
        if (!resources) {
            return;
        }

        while (resource = resources[i++]) {
            // filter out error statuses and status codes
            if (resource.status == 'ready' && resource.statusCode >= 200 &&
                resource.statusCode < 300) {

                save = true;
                httpCache.set(encodeURI(resource.url), resource);
            }
        }
        if (save) {
            httpCache.save();
        }
    };

    Jazzcat.defaults = {
        selector: 'script',
        attribute: 'x-src',
        base: '//jazzcat.mobify.com',
        responseType: 'jsonp',
        execCallback: 'Jazzcat.exec',
        loadCallback: 'Jazzcat.load',
        cacheLoadCallback: 'Jazzcat.httpCache.load',
        inlineLoader: 'true',
        concat: false,
        projectName: '',
    };

    return Jazzcat;
}));
require(["mobifyjs/utils", "mobifyjs/resizeImages", "mobifyjs/jazzcat"],
         function(Utils, ResizeImages, Jazzcat) {
    var Mobify = window.Mobify;
    
    // Backwards compatible fixes
    var $ = Mobify && Mobify.$;
    if (!($ && $.fn)) {
        return;
    }

    // Expose API Surface
    Mobify.combo = {};
    Mobify.combo.httpCache = Jazzcat.httpCache;
    Mobify.combo.load = Jazzcat.load;
    Mobify.combo.exec = Jazzcat.exec;
    Mobify.combo.getURL = Jazzcat.getURL;
    
    $.fn.combineScripts = function(opts) {
        if (!this) {
            return $([]);
        }
        opts = opts || {};
        this.remove();
        opts.inlineLoader = false;
        return $(Jazzcat.optimizeScripts.call(window, this, opts));
    };
    
    Jazzcat.defaults.projectName = (
        (Mobify && Mobify.config && Mobify.config.projectName) ||
        ''
    );
    Jazzcat.defaults.execCallback = 'Mobify.combo.exec';
    Jazzcat.defaults.loadCallback = 'Mobify.combo.load';
    Jazzcat.defaults.cacheLoadCallback = 'Mobify.combo.httpCache.load';

    // expose defaults for testing
    $.fn.combineScripts.defaults = Jazzcat.defaults;

    Mobify.cssURL = function(obj) {
        return '//jazzcat.mobify.com/css/' + encodeURIComponent(JSON.stringify(obj));
    };

    // ResizeImages
    $.fn.resizeImages = function(opts) {
        var imgs = this.find('img').toArray();
        return ResizeImages.resize.call(window, imgs, opts);
    };
    
    ResizeImages.defaults.projectName = Mobify.config.projectName || '';
    $.fn.resizeImages.defaults = ResizeImages.defaults;

    Mobify.getImageURL = function(url, options) {
        // getImageURL behaves differently in 2.0 for how
        // options get populated.
        var opts = ResizeImages.processOptions();
        if (options) {
            Utils.extend(opts, options);
        }
        return ResizeImages.getImageURL(url, opts);
    };

}, undefined, true);
// relPath, forceSync
;
define("main", function(){});

}());