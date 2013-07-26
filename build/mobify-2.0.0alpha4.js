(function () {
/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
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
        aps = [].slice;

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
        var nameParts, nameSegment, mapValue, foundMap,
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

                name = baseParts.concat(name.split("/"));

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
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

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

            ret = callback.apply(defined[name], args);

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
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

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

define('utils',[], function() {

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

return Utils;

});
define('capture',["utils"], function(Utils) {

// ##
// # Static Variables/Functions
// ##

// v6 tag backwards compatibility change
if (window.Mobify && 
    !window.Mobify.capturing &&
    document.getElementsByTagName("plaintext").length) 
{
            window.Mobify.capturing = true;
}

var openingScriptRe = /(<script[\s\S]*?>)/gi;

// Inline styles and scripts are disabled using a unknown type.
var tagDisablers = {
    style: ' media="mobify-media"',
    script: ' type="text/mobify-script"'
};

var tagEnablingRe = new RegExp(Utils.values(tagDisablers).join('|'), 'g');

// Map of all attributes we should disable (to prevent resources from downloading)
var disablingMap = {
    img:    ['src'],
    source: ['src'],
    iframe: ['src'],
    script: ['src', 'type'],
    link:   ['href'],
    style:  ['media'],
};

var affectedTagRe = new RegExp('<(' + Utils.keys(disablingMap).join('|') + ')([\\s\\S]*?)>', 'gi');
var attributeDisablingRes = {};
var attributesToEnable = {};

// Populate `attributesToEnable` and `attributeDisablingRes`.
for (var tagName in disablingMap) {
    if (!disablingMap.hasOwnProperty(tagName)) continue;
    var targetAttributes = disablingMap[tagName];

    targetAttributes.forEach(function(value) {
        attributesToEnable[value] = true;
    });

    // <space><attr>='...'|"..."
    attributeDisablingRes[tagName] = new RegExp(
        '\\s+((?:'
        + targetAttributes.join('|')
        + ")\\s*=\\s*(?:('|\")[\\s\\S]+?\\2))", 'gi');
}

/**
 * Returns the name of a node (in lowercase)
 */
function nodeName(node) {
    return node.nodeName.toLowerCase();
}

/**
 * Escape quotes
 */
function escapeQuote(s) {
    return s.replace('"', '&quot;');
}


/**
 * Helper method for looping through and grabbing strings of elements
 * in the captured DOM after plaintext insertion
 */
function extractHTMLStringFromElement(container) {
    if (!container) return '';

    return [].map.call(container.childNodes, function(el) {
        var tagName = nodeName(el);
        if (tagName == '#comment') return '<!--' + el.textContent + '-->';
        if (tagName == 'plaintext') return el.textContent;
        // Don't allow mobify related scripts to be added to the new document
        if (tagName == 'script' && ((/mobify/.test(el.src) || /mobify/i.test(el.textContent)))) {
            return '';
        }
        return el.outerHTML || el.nodeValue || Utils.outerHTML(el);
    }).join('');
}

// cached div used repeatedly to create new elements
var cachedDiv = document.createElement('div');

// ##
// # Constructor
// ##
var Capture = function(doc, prefix) {
    this.doc = doc;
    this.prefix = prefix || "x-";
    if (window.Mobify) window.Mobify.prefix = this.prefix;

    var capturedStringFragments = this.createDocumentFragmentsStrings();
    Utils.extend(this, capturedStringFragments);

    var capturedDOMFragments = this.createDocumentFragments();
    Utils.extend(this, capturedDOMFragments);
};

var init = Capture.init = function(callback, doc, prefix) {
    var doc = doc || document;

    var createCapture = function(callback, doc, prefix) {
        var capture = new Capture(doc, prefix);
        callback(capture);
    }
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
    if (document.attachEvent ? doc.readyState === "complete" : doc.readyState !== "loading") {
        createCapture(callback, doc, prefix);
    }
    // We may be in "loading" state by the time we get here, meaning we are
    // not ready to capture. Next step after "loading" is "interactive",
    // which is a valid state to start capturing on (except IE), and thus when ready
    // state changes once, we know we are good to start capturing.
    // Cannot rely on using DOMContentLoaded because this event prematurely fires
    // for some IE10s.
    else {
        var created = false;
        doc.addEventListener("readystatechange", function() {
            if (!created) {
                created = true;
                createCapture(callback, doc, prefix);
            }
        }, false);
    }
};

/**
 * Grab attributes from a string representation of an elements and clone them into dest element
 */
Capture.cloneAttributes = function(sourceString, dest) {
    var match = sourceString.match(/^<(\w+)([\s\S]*)$/i);
    cachedDiv.innerHTML = '<div' + match[2];
    [].forEach.call(cachedDiv.firstChild.attributes, function(attr) {
        try {
            dest.setAttribute(attr.nodeName, attr.nodeValue);
        } catch (e) {
            console.error("Error copying attributes while capturing: ", e);
        }
    });

    return dest;
};

/**
 * Returns a string with all external attributes disabled.
 * Includes special handling for resources referenced in scripts and inside
 * comments.
 * Not declared on the prototype so it can be used as a static method.
 */
Capture.disable = function(htmlStr, prefix) {
    var self = this;
    // Disables all attributes in disablingMap by prepending prefix
    var disableAttributes = (function(){
        return function(whole, tagName, tail) {
            lowercaseTagName = tagName.toLowerCase();
            return result = '<' + lowercaseTagName + (tagDisablers[lowercaseTagName] || '')
                + tail.replace(attributeDisablingRes[lowercaseTagName], ' ' + prefix + '$1') + '>';
        }
    })();

    var splitRe = /(<!--[\s\S]*?-->)|(?=<\/script)/i;
    var tokens = htmlStr.split(splitRe);
    var ret = tokens.map(function(fragment) {
                var parsed

                // Fragment may be empty or just a comment, no need to escape those.
                if (!fragment) return '';
                if (/^<!--/.test(fragment)) return fragment;

                // Disable before and the <script> itself.
                // parsed = [before, <script>, script contents]
                parsed = fragment.split(openingScriptRe);
                parsed[0] = parsed[0].replace(affectedTagRe, disableAttributes);
                if (parsed[1]) parsed[1] = parsed[1].replace(affectedTagRe, disableAttributes);
                return parsed;
            });

    return [].concat.apply([], ret).join('');
};

/**
 * Returns a string with all disabled external attributes enabled.
 * Not declared on the prototype so it can be used as a static method.
 */
Capture.enable = function(htmlStr, prefix) {
    var attributeEnablingRe = new RegExp('\\s' + prefix + '(' + Utils.keys(attributesToEnable).join('|') + ')', 'gi');
    return htmlStr.replace(attributeEnablingRe, ' $1').replace(tagEnablingRe, '');
};

/**
 * Return a string for the opening tag of DOMElement `element`.
 */
Capture.openTag = function(element) {
    if (!element) return '';
    if (element.length) element = element[0];

    var stringBuffer = [];

    [].forEach.call(element.attributes, function(attr) {
        stringBuffer.push(' ', attr.name, '="', escapeQuote(attr.value), '"');
    })

    return '<' + nodeName(element) + stringBuffer.join('') + '>';
};

/**
 * Return a string for the doctype of the current document.
 */
Capture.prototype.getDoctype = function() {
    var doctypeEl = this.doc.doctype || [].filter.call(this.doc.childNodes, function(el) {
            return el.nodeType == Node.DOCUMENT_TYPE_NODE
        })[0];

    if (!doctypeEl) return '';

    return '<!DOCTYPE HTML'
        + (doctypeEl.publicId ? ' PUBLIC "' + doctypeEl.publicId + '"' : '')
        + (doctypeEl.systemId ? ' "' + doctypeEl.systemId + '"' : '')
        + '>';
};

/**
 * Returns an object containing the state of the original page. Caches the object
 * in `extractedHTML` for later use.
 */
 Capture.prototype.createDocumentFragmentsStrings = function() {
    var doc = this.doc;
    var headEl = doc.getElementsByTagName('head')[0] || doc.createElement('head');
    var bodyEl = doc.getElementsByTagName('body')[0] || doc.createElement('body');
    var htmlEl = doc.getElementsByTagName('html')[0];

    captured = {
        doctype: this.getDoctype(),
        htmlOpenTag: Capture.openTag(htmlEl),
        headOpenTag: Capture.openTag(headEl),
        bodyOpenTag: Capture.openTag(bodyEl),
        headContent: extractHTMLStringFromElement(headEl),
        bodyContent: extractHTMLStringFromElement(bodyEl)
    };

    /**
     * RR: I assume that Mobify escaping tag is placed in <head>. If so, the <plaintext>
     * it emits would capture the </head><body> boundary, as well as closing </body></html>
     * Therefore, bodyContent will have these tags, and they do not need to be added to .all()
     */
    captured.all = function(inject) {
        return this.doctype + this.htmlOpenTag + this.headOpenTag + (inject || '') + this.headContent + this.bodyContent;
    }

    // During capturing, we will usually end up hiding our </head>/<body ... > boundary
    // within <plaintext> capturing element. To construct source DOM, we need to rejoin
    // head and body content, iterate through it to find head/body boundary and expose
    // opening <body ... > tag as a string.

    // Consume comments without grouping to avoid catching
    // <body> inside a comment, common with IE conditional comments.
    var bodySnatcher = /<!--(?:[\s\S]*?)-->|(<\/head\s*>|<body[\s\S]*$)/gi;

    //Fallback for absence of </head> and <body>
    var rawHTML = captured.bodyContent = captured.headContent + captured.bodyContent;
    captured.headContent = '';

    // Search rawHTML for the head/body split.
    for (var match; match = bodySnatcher.exec(rawHTML); match) {
        // <!-- comment --> . Skip it.
        if (!match[1]) continue;

        if (match[1][1] == '/') {
            // Hit </head. Gather <head> innerHTML. Also, take trailing content,
            // just in case <body ... > is missing or malformed
            captured.headContent = rawHTML.slice(0, match.index);
            captured.bodyContent = rawHTML.slice(match.index + match[1].length);
        } else {
            // Hit <body. Gather <body> innerHTML.

            // If we were missing a </head> before, now we can pick up everything before <body
            captured.headContent = captured.head || rawHTML.slice(0, match.index);
            captured.bodyContent = match[0];

            // Find the end of <body ... >
            var parseBodyTag = /^((?:[^>'"]*|'[^']*?'|"[^"]*?")*>)([\s\S]*)$/.exec(captured.bodyContent);

            // Will skip this if <body was malformed (e.g. no closing > )
            if (parseBodyTag) {
                // Normal termination. Both </head> and <body> were recognized and split out
                captured.bodyOpenTag = parseBodyTag[1];
                captured.bodyContent = parseBodyTag[2];
            }
            break;
        }
    }
    return captured;
};

/**
 * Gather escaped content from the DOM, unescaped it, and then use
 * `document.write` to revert to the original page.
 */
Capture.prototype.restore = function() {
    var self = this;
    var doc = self.doc;

    var restore = function() {
        doc.removeEventListener('DOMContentLoaded', restore, false);

        setTimeout(function() {
            doc.open();
            doc.write(self.all());
            doc.close();
        }, 15);
    };

    if (/complete|interactive|loaded/.test(doc.readyState)) {
        restore();
    } else {
        doc.addEventListener('DOMContentLoaded', restore, false);
    }
};

/**
 * Set the content of an element with html from a string
 */
Capture.prototype.setElementContentFromString = function(el, htmlString) {
    // We must pass in document because elements created for dom insertion must be
    // inserted into the same dom they are created by.
    var doc = this.doc;
    for (cachedDiv.innerHTML = htmlString; cachedDiv.firstChild; el.appendChild(cachedDiv.firstChild));
};

/**
 * Grab fragment strings and construct DOM fragments
 * returns htmlEl, headEl, bodyEl, doc
 */
Capture.prototype.createDocumentFragments = function() {
    var docFrags = {};
    var doc = docFrags.capturedDoc = document.implementation.createHTMLDocument("")
    var htmlEl = docFrags.htmlEl = doc.documentElement;
    var headEl = docFrags.headEl = htmlEl.firstChild;
    var bodyEl = docFrags.bodyEl = htmlEl.lastChild;

    // Reconstruct html, body, and head with the same attributes as the original document
    Capture.cloneAttributes(this.htmlOpenTag, htmlEl);
    Capture.cloneAttributes(this.headOpenTag, headEl);
    Capture.cloneAttributes(this.bodyOpenTag, bodyEl);

    // Set innerHTML of new source DOM body
    bodyEl.innerHTML = Capture.disable(this.bodyContent, this.prefix);
    var disabledHeadContent = Capture.disable(this.headContent, this.prefix);

    // On FF4, and potentially other browsers, you cannot modify <head>
    // using innerHTML. In that case, do a manual copy of each element
    try {
        headEl.innerHTML = disabledHeadContent;
    } catch (e) {
        var title = headEl.getElementsByTagName('title')[0];
        title && headEl.removeChild(title);
        this.setElementContentFromString(headEl, disabledHeadContent);
    }

    // Append head and body to the html element
    htmlEl.appendChild(headEl);
    htmlEl.appendChild(bodyEl);

    return docFrags;
};

/**
 * Returns an escaped HTML representation of the captured DOM
 */
Capture.prototype.escapedHTMLString = function() {
    var doc = this.capturedDoc;
    var html = Capture.enable(doc.documentElement.outerHTML || Utils.outerHTML(doc.documentElement), this.prefix);
    var htmlWithDoctype = this.doctype + html;
    return htmlWithDoctype;
};

/**
 * Rewrite the document with a new html string
 */
Capture.prototype.render = function(htmlString) {
    var escapedHTMLString;
    if (!htmlString) {
        escapedHTMLString = this.escapedHTMLString();
    } else {
        escapedHTMLString = Capture.enable(htmlString);
    }

    var doc = this.doc;

    // Set capturing state to false so that the user main code knows how to execute
    if (window.Mobify) window.Mobify.capturing = false;

    // Asynchronously render the new document
    setTimeout(function(){
        doc.open("text/html", "replace");
        doc.write(escapedHTMLString);
        doc.close();
    });
};

/**
 * Get the captured document
 */
Capture.prototype.getCapturedDoc = function(options) {
    return this.capturedDoc;
};

/**
 * Insert Mobify scripts back into the captured doc
 * in order for the library to work post-document.write
 */
Capture.prototype.insertMobifyScripts = function() {
    var doc = this.capturedDoc;
    // After document.open(), all objects will be removed.
    // To provide our library functionality afterwards, we
    // must re-inject the script.
    var mobifyjsScript = document.getElementById("mobify-js");

    // v6 tag backwards compatibility change
    if (!mobifyjsScript) {
        mobifyjsScript = document.getElementsByTagName("script")[0];
        mobifyjsScript.id = "mobify-js";
        mobifyjsScript.setAttribute("class", "mobify");
    }

    var head = this.headEl;

    // If main script exists, re-inject it.
    var mainScript = document.getElementById("main-executable");
    if (mainScript) {
        // Since you can't move nodes from one document to another,
        // we must clone it first using importNode:
        // https://developer.mozilla.org/en-US/docs/DOM/document.importNode
        var mainClone = doc.importNode(mainScript, false);
        if (!mainScript.src) {
            mainClone.innerHTML = mainScript.innerHTML;
        }
        head.insertBefore(mainClone, head.firstChild)
    }
    // reinject mobify.js file
    var mobifyjsClone = doc.importNode(mobifyjsScript, false);
    head.insertBefore(mobifyjsClone, head.firstChild);
};

/**
 * Render the captured document
 */
Capture.prototype.renderCapturedDoc = function(options) {
    var doc = this.capturedDoc;

    // Insert the mobify scripts back into the captured doc
    this.insertMobifyScripts();

    // Inject timing point (because of blowing away objects on document.write)
    // if it exists
    if (window.Mobify && window.Mobify.points) {
        var body = this.bodyEl;
        var date = doc.createElement("div");
        date.id = "mobify-point";
        date.setAttribute("style", "display: none;")
        date.innerHTML = window.Mobify.points[0];
        body.insertBefore(date, body.firstChild);
    }

    this.render();
};

return Capture;

});

define('resizeImages',["utils"], function(Utils) {

var ResizeImages = window.ResizeImages = {};

function getPhysicalScreenSize(devicePixelRatio) {

    function multiplyByPixelRatio(sizes) {
        var dpr = devicePixelRatio || 1;

        sizes.width = Math.round(sizes.width * dpr);
        sizes.height = Math.round(sizes.height * dpr);

        return sizes;
    }

    var iOS = navigator.userAgent.match(/iphone|ipod|ipad/i);
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
}

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
    var opts = Utils.clone(defaults);
    if (options) {
        Utils.extend(opts, options);
    }

    var bits = [opts.proto + opts.host];

    if (opts.projectName) {
        var projectId = "project-" + opts.projectName;
        bits.push(projectId);
    }

    if (options.cacheHours) {
        bits.push('c' + options.cacheHours);
    }

    if (opts.format) {
        bits.push(options.format + (options.quality || ''));
    }

    if (opts.maxWidth) {
        bits.push(options.maxWidth)

        if (opts.maxHeight) {
            bits.push(options.maxHeight);
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
            element.setAttribute(opts.targetAttribute, ResizeImages.getImageURL(url, opts));
            element.setAttribute('data-orig-src', srcVal);
            if(opts.onerror) {
                element.setAttribute('onerror', opts.onerror);
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
    if (sources.length === 0) {
        return;
    }

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
 * Searches the collection for image elements and modifies them to use
 * the Image Resize service. Pass `options` to modify how the images are 
 * resized.
 */

ResizeImages.resize = function(elements, options) {
    var opts = Utils.clone(defaults);
    if (options) {
        Utils.extend(opts, options);
    }

    var dpr = opts.devicePixelRatio || window.devicePixelRatio;

    var screenSize = getPhysicalScreenSize(dpr);

    // If maxHeight/maxWidth are not specified, use screen dimentions
    // in device pixels
    var width = opts.maxWidth || screenSize.width;
    var height = opts.maxHeight || screenSize.height;

    // Otherwise, compute device pixels
    if (dpr && opts.maxWidth) {
        width = width * dpr;
        if (opts.maxHeight) {
            height = height * dpr;
        }
    }

    // Doing rounding for non-integer device pixel ratios
    opts.maxWidth = Math.ceil(width);
    opts.maxHeight = Math.ceil(height);

    if (!opts.format && opts.webp) {
        opts.format = "webp";
    }

    for(var i=0; i < elements.length; i++) {
        var element = elements[i];

        // For an `img`, simply modify the src attribute
        if (element.nodeName === 'IMG') {
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

var capturing = window.Mobify && window.Mobify.capturing || false;

var defaults = {
      proto: '//',
      host: 'ir0.mobify.com',
      projectName: "oss-" + location.hostname.replace(/[^\w]/g, '-'),
      sourceAttribute: "x-src",
      targetAttribute: (capturing ? "x-src" : "src"),
      webp: ResizeImages.supportsWebp(),
      onerror: 'ResizeImages.restoreOriginalSrc(event);'
};

var restoreOriginalSrc = ResizeImages.restoreOriginalSrc = function(event) {
    var origSrc;
    event.target.removeAttribute('onerror'); // remove ourselves
    if (origSrc = event.target.getAttribute('data-orig-src')) {
        event.target.setAttribute('src', origSrc);
    }
};

return ResizeImages;

});

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
define('jazzcat',["utils", "capture"], function(Utils, Capture) {
    /**
     * An HTTP 1.1 compliant localStorage backed cache.
     */
    var httpCache = {
        cache: {},
        options: {},
        utils: {}
    }

    var localStorageKey = 'Mobify-Jazzcat-Cache-v1.0';

    /**
     * Reset the cache, optionally to `val`. Useful for testing.
     */
    httpCache.reset = function(val) {
        httpCache.cache = val || {};
    };

    /**
     * Returns value of `key` if it is in the cache.
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
    var canSave = true; // save mutex to prevent multiple saves before onload
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
                debugger;
                var resource;
                var serialized;
                // End of time.
                var lruTime = 9007199254740991;
                var lruKey;
                resources = resources || Utils.clone(httpCache.cache);
                try {
                    serialized = JSON.stringify(resources);
                } catch(e) {
                    canSave = true
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
                    for (key in resources) {
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
            if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
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
    httpCache.ccParse = function(directives) {
        var obj = {};
        var match;

        directives.split(',').forEach(function(directive) {
            if (match = ccDirectives.exec(directive)) {
                obj[match[1]] = true;
            } else if (match = ccMaxAge.exec(directive)) {
                obj[match[1]] = parseInt(match[2]);
            }
        });

        return obj;
    };

    /**
     * Returns `false` if a response is "fresh" by HTTP/1.1 caching rules or 
     * less than ten minutes old. Treats invalid headers as stale.
     */
    httpCache.utils.isStale = function(resource, options) {
        var headers = resource.headers || {};
        var cacheControl = headers['cache-control'];
        var now = Date.now();
        var date = Date.parse(headers['date']);
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
            cacheControl = httpCache.ccParse(cacheControl);

            if ((cacheControl['max-age']) &&
                (!cacheControl['private']) &&
                (!cacheControl['no-store']) &&
                (!cacheControl['no-cache'])) {
                // Convert the max-age directive to ms.
                return now > (date + (cacheControl['max-age'] * 1000));
            }
        }

        // If `expires` is present, we are stale if we are older.
        if (date = Date.parse(headers.expires)) {
            return now > date;
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
     *   <script>Jazzcat.exec("http://code.jquery.com/jquery.js")</script>
     *   <script>$(function() { alert("helo joe"); })</script>
     *
     * Note that this only the first part of the Jazzcat transformation. The
     * bootloader script is inserted by the overriden `Capture.enabled` function.
     * 
     * Takes an option argument, `options`, an object whose properties define 
     * optiosn that alter jazzcat's javascript loading, caching and execution 
     * behaviour. Right now the options are:
     *
     * - `cacheOverrideTime` :  An integer value greater than 10 that will 
     *                          override the freshness implied by the HTTP 
     *                          caching headers set on the reource.
     */

    Jazzcat.optimizeScripts = function(scripts, options) {
        if (options && options.cacheOverrideTime !== undefined) {
            Utils.extend(httpCache.options,
              {overrideTime: options.cacheOverrideTime});
        }
        // Fastfail if there are no scripts or if required features are missing.
        if (!scripts.length || Jazzcat.isIncompatibleBrowser()) {
            return scripts;
        }

        options = Utils.extend({}, Jazzcat.defaults, options || {});
        var jsonp = (options.responseType === 'jsonp');
        var concat = options.concat;

        // load data from localStorage
        httpCache.load(httpCache.options);

        // helper method for inserting the loader script
        // before the first uncached script in the "uncached" array
        var insertLoader = function(script, urls) {
            if (script) {
                var loader = Jazzcat.getLoaderScript(urls, options);
                // insert the loader directly before the first uncached script
                script.parentNode.insertBefore(loader, script);
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
        for (var i=0, len=scripts.length; i<len; i++) {
            var script = scripts[i];

            url = script.getAttribute(options.attribute);

            // skip if the script is inline
            if (!url) continue;
            url = Utils.absolutify(url);
            if (!Utils.httpUrl(url)) continue;

            var parent = (script.parentNode.nodeName === "HEAD" ? "head" : "body");

            if (jsonp) {
                // Insert the httpCache loader before the first script
                if (i===0) {
                    var httpLoaderScript = Jazzcat.getHttpCacheLoaderScript();
                    script.parentNode.insertBefore(httpLoaderScript, script);
                }

                // if: the script is not in the cache (or not jsonp), add a loader
                // else: queue for concatenation
                if (!httpCache.get(url)) {
                    if (!concat) {
                        insertLoader(script, [url]);
                    }
                    else {
                        if (toConcat[parent].firstScript === undefined) {
                            toConcat[parent].firstScript = script
                        }
                        toConcat[parent].urls.push(url);
                    }
                }

                // Rewriting script to grab contents from localstorage
                // ex. <script>Jazzcat.combo.exec("http://code.jquery.com/jquery.js")</script>                    
                script.innerHTML =  options.execCallback + "('" + url + "');";
                // Remove the src attribute
                script.removeAttribute(options.attribute);
            }
            else {
                if (!concat) {
                    var jazzcatUrl = Jazzcat.getURL([url], options);
                    script.setAttribute(options.attribute, jazzcatUrl);
                }
                else {
                    if (toConcat[parent].firstScript === undefined) {
                        toConcat[parent].firstScript = script
                    }
                    toConcat[parent].urls.push(url);
                }
            }

        }
        // insert the loaders for uncached head and body scripts if
        // using concatenation
        if (concat) {
            insertLoader(toConcat['head'].firstScript, toConcat['head'].urls);
            insertLoader(toConcat['body'].firstScript, toConcat['body'].urls);
        }

        // if responseType is js and we are concatenating,
        // remove original scripts
        if (!jsonp && concat) {
            for (var i=0, len=scripts.length; i<len; i++) {
                var script = scripts[i];
                script.parentNode.removeChild(script);
            }
        }

        return scripts;
    };

    /**
     * Private helper that returns a script node that when run, loads the 
     * httpCache from localStorage.
     */
    Jazzcat.getHttpCacheLoaderScript = function() {
        var loadFromCacheScript = document.createElement('script');
        loadFromCacheScript.innerHTML = (httpCache.options.overrideTime ?
          "Jazzcat.httpCache.load(" + JSON.stringify(httpCache.options) + ");" :
          "Jazzcat.httpCache.load();" );

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
    Jazzcat.exec = function(url) {
        var resource = httpCache.get(url, true);
        var out;

        if (!resource) {
            out = 'src="' + url + '">';
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
            out += '>' + resource.body.replace(scriptSplitRe, '$1\\$2');
        }

        // `document.write` is used to ensure scripts are executed in order,
        // as opposed to "as fast as possible"
        // http://hsivonen.iki.fi/script-execution/
        // http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
        // This call seems to do nothing in Opera 11/12
        Jazzcat.write.call(document, '<script ' + out + '<\/script>');
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
            if (resource.status == 'ready') {
                save = true;
                httpCache.set(encodeURI(resource.url), resource);
            }
        }
        if (Jazzcat.defaults.persist && save) {
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
        concat: true,
        projectName: '',
        persist: true // useful for debugging
    };

    return Jazzcat;
});

define('unblockify',["utils", "capture"], function(Utils, Capture) {

var Unblockify = {}

// Moves all scripts to the end of body by overriding insertMobifyScripts
Unblockify.moveScripts = function(scripts, doc) {
    // Remove elements from the document
    Utils.removeElements(scripts, doc);

    for (var i=0,ii=scripts.length; i<ii; i++) {
        var script = scripts[i];
        doc.body.appendChild(script);
    }
};


Unblockify.unblock = function(scripts) {
    // Grab reference to old insertMobifyScripts method
    var oldInsert = Capture.prototype.insertMobifyScripts;

    // Override insertMobifyScripts to also move the scripts
    // to the end of the body
    Capture.prototype.insertMobifyScripts = function() {
        oldInsert.call(this);

        var doc = this.capturedDoc;
        Unblockify.moveScripts(scripts, doc);
    };
};

return Unblockify;

});
/**
 * cssOptimize - Client code to a css optimization service
 */

define('cssOptimize',["utils"], function(Utils) {

var CssOptimize = window.cssOptimize = {};

/**
 * Takes an original, absolute url of a stylesheet, returns a url for that
 * stylesheet going through the css service.
 */

CssOptimize.getCssUrl = function(url, options) {
    var opts = Utils.extend({}, defaults, options);
    var bits = [opts.protoAndHost];

    if (opts.projectName) {
        bits.push('project-' + opts.projectName);
    }

    bits.push(opts.endpoint);
    bits.push(url);

    return bits.join('/');
};

/**
 * Rewrite the href of a stylesheet referencing `<link>` element to go through 
 * our service.
 */
CssOptimize._rewriteHref = function(element, options) {
    var attributeVal = element.getAttribute(options.targetAttribute);
    var url;
    if (attributeVal) {
        url = Utils.absolutify(attributeVal);
        if (Utils.httpUrl(url)) {
            element.setAttribute('data-orig-href', attributeVal);
            element.setAttribute(options.targetAttribute,
                                 CssOptimize.getCssUrl(url, options));
            if (options.onerror) {
                element.setAttribute('onerror', options.onerror);
            }
        }
    }
};

/**
 * Takes an array-like object of `<link>` elements
 */
CssOptimize.optimize = function(elements, options) {
    var opts = Utils.extend({}, defaults, options);
    var element;

    for(var i = 0, len = elements.length; i < len; i++) {
        element = elements[i];
        if (element.nodeName === 'LINK' &&
            element.getAttribute('rel') === 'stylesheet' &&
            element.getAttribute(opts.targetAttribute)) {

            CssOptimize._rewriteHref(element, opts);
        }
    }
};

/**
 * An 'error' event handler designed to be set using an "onerror" attribute that
 * will set the target elements "href" attribute to the value of its 
 * "data-orig-href" attribute, if one exists.
 */
var restoreOriginalHref = CssOptimize.restoreOriginalHref = function(event) {
    var origHref;
    event.target.removeAttribute('onerror'); //remove error handler
    if(origHref = event.target.getAttribute('data-orig-href')) {
        event.target.setAttribute('href', origHref);
    }
};

var defaults = CssOptimize._defaults = {
    protoAndHost: '//jazzcat.mobify.com',
    endpoint: 'cssoptimizer',
    projectName: 'oss-' + location.hostname.replace(/[^\w]/g, '-'),
    targetAttribute: 'x-href',
    onerror: 'Mobify.CssOptimize.restoreOriginalHref(event);'
};

return CssOptimize;
});
define('external/picturefill',["utils", "capture"], function(Utils, Capture) {

var capturing = window.Mobify && window.Mobify.capturing || false;

if (capturing) {
    // Override renderCapturedDoc to disable img elements in picture elements
    var oldRenderCapturedDoc = Capture.prototype.renderCapturedDoc;
    Capture.prototype.renderCapturedDoc = function(options) {
        // Change attribute of any img element inside a picture element
        // so it does not load post-flood
        var imgsInPicture = this.capturedDoc.querySelectorAll('picture img');
        for (var i = 0, len = imgsInPicture.length; i < len; i++) {
            var disableImg = imgsInPicture[i];
            var srcAttr = window.Mobify && window.Mobify.prefix + 'src';
            disableImg.setAttribute('data-orig-src', disableImg.getAttribute(srcAttr));
            disableImg.removeAttribute(srcAttr);
        }
        oldRenderCapturedDoc.apply(this, arguments);
    }

    return;
}

window.matchMedia = window.matchMedia || Utils.matchMedia(document);

/* https://github.com/Wilto/picturefill-proposal */
/*! Picturefill - Author: Scott Jehl, 2012 | License: MIT/GPLv2 */ 
/*
    Picturefill: A polyfill for proposed behavior of the picture element, which does not yet exist, but should. :)
    * Notes: 
        * For active discussion of the picture element, see http://www.w3.org/community/respimg/
        * While this code does work, it is intended to be used only for example purposes until either:
            A) A W3C Candidate Recommendation for <picture> is released
            B) A major browser implements <picture>
*/ 
(function( w ){
    // Enable strict mode
    

    // User preference for HD content when available
    var prefHD = false || w.localStorage && w.localStorage[ "picturefill-prefHD" ] === "true",
        hasHD;

    // Test if `<picture>` is supported natively, if so, exit - no polyfill needed.
    if ( !!( w.document.createElement( "picture" ) && w.document.createElement( "source" ) && w.HTMLPictureElement ) ){
        return;
    }

    w.picturefill = function() {
        var ps = w.document.getElementsByTagName( "picture" );

        // Loop the pictures
        for( var i = 0, il = ps.length; i < il; i++ ){
            var sources = ps[ i ].getElementsByTagName( "source" ),
                picImg = null,
                matches = [];

            // If no sources are found, they're likely erased from the DOM. Try finding them inside comments.
            if( !sources.length ){
                var picText =  ps[ i ].innerHTML,
                    frag = w.document.createElement( "div" ),
                    // For IE9, convert the source elements to divs
                    srcs = picText.replace( /(<)source([^>]+>)/gmi, "$1div$2" ).match( /<div[^>]+>/gmi );

                frag.innerHTML = srcs.join( "" );
                sources = frag.getElementsByTagName( "div" );
            }

            // See which sources match
            for( var j = 0, jl = sources.length; j < jl; j++ ){
                var media = sources[ j ].getAttribute( "media" );
                // if there's no media specified, OR w.matchMedia is supported 
                if( !media || ( w.matchMedia && w.matchMedia( media ).matches ) ){
                    matches.push( sources[ j ] );
                }
            }

            // Find any existing img element in the picture element
            picImg = ps[ i ].getElementsByTagName( "img" )[ 0 ];

            if( matches.length ){
                // Grab the most appropriate (last) match.
                var match = matches.pop(),
                    srcset = match.getAttribute( "srcset" );

                if( !picImg ){
                    picImg = w.document.createElement( "img" );
                    picImg.alt = ps[ i ].getAttribute( "alt" );
                    ps[ i ].appendChild( picImg );
                }

                if( srcset ) {
                        var screenRes = ( prefHD && w.devicePixelRatio ) || 1, // Is it worth looping through reasonable matchMedia values here?
                            sources = srcset.split(","); // Split comma-separated `srcset` sources into an array.

                        hasHD = w.devicePixelRatio > 1;

                        for( var res = sources.length, r = res - 1; r >= 0; r-- ) { // Loop through each source/resolution in `srcset`.
                            var source = sources[ r ].replace(/^\s*/, '').replace(/\s*$/, '').split(" "), // Remove any leading whitespace, then split on spaces.
                                resMatch = parseFloat( source[1], 10 ); // Parse out the resolution for each source in `srcset`.

                            if( screenRes >= resMatch ) {
                                if( picImg.getAttribute( "src" ) !== source[0] ) {
                                    var newImg = document.createElement("img");

                                    newImg.src = source[0];
                                    // When the image is loaded, set a width equal to that of the original’s intrinsic width divided by the screen resolution:
                                    newImg.onload = function() {
                                        // Clone the original image into memory so the width is unaffected by page styles:
                                        this.width = ( this.cloneNode( true ).width / resMatch );
                                    }
                                    picImg.parentNode.replaceChild( newImg, picImg );
                                }
                                break; // We’ve matched, so bail out of the loop here.
                            }
                        }
                } else {
                    // No `srcset` in play, so just use the `src` value:
                    picImg.src = match.getAttribute( "src" );
                }
            }
        }
    };

    // Run on resize and domready (w.load as a fallback)
    if( w.addEventListener ){
        w.addEventListener( "resize", w.picturefill, false );
        w.addEventListener( "DOMContentLoaded", function(){
            w.picturefill();
            // Run once only
            w.removeEventListener( "load", w.picturefill, false );
        }, false );
        w.addEventListener( "load", w.picturefill, false );
    }
    else if( w.attachEvent ){
        w.attachEvent( "onload", w.picturefill );
    }
})( this );

return;

});
require(["utils", "capture", "resizeImages", "jazzcat", "unblockify", "cssOptimize", "external/picturefill"], function(Utils, Capture, ResizeImages, Jazzcat, Unblockify, CssOptimize) {
    var Mobify = window.Mobify = window.Mobify || {};
    Mobify.Utils = Utils;
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;
    Mobify.Jazzcat = Jazzcat;
    Mobify.CssOptimize = CssOptimize;
    Mobify.Unblockify = Unblockify;
    Mobify.api = "2.0"; // v6 tag backwards compatibility change
    return Mobify;

}, undefined, true);
// relPath, forceSync;
define("mobify-library", function(){});
}());