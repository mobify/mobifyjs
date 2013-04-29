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
}

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
    // iOS 4.3, some Android 2.X.X have a non-typical "loaded" readyState,
    // which is an acceptable readyState to start capturing on, because
    // the data is fully loaded from the server at that state.
    if (/complete|interactive|loaded/.test(doc.readyState)) {
        createCapture(callback, doc, prefix);
    }
    // We may be in "loading" state by the time we get here, meaning we are
    // not ready to capture. Next step after "loading" is "interactive",
    // which is a valid state to start capturing on, and thus when ready
    // state changes once, we know we are good to start capturing.
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

    // Since you can't move nodes from one document to another,
    // we must clone it first using importNode:
    // https://developer.mozilla.org/en-US/docs/DOM/document.importNode
    var mobifyjsClone = doc.importNode(mobifyjsScript, false);
    var head = this.headEl;
    head.insertBefore(mobifyjsClone, head.firstChild);

    // If main exists, re-inject it as well.
    var mainScript = document.getElementById("mobify-js-main");
    if (mainScript) {
        var mainClone = doc.importNode(mainScript, false);
        this.bodyEl.appendChild(mainClone);
    }
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

var ResizeImages = {}

var absolutify = document.createElement('a')

// A regex for detecting http(s) URLs.
var httpRe = /^https?/

// A protocol relative URL for the host ir0.mobify.com
var PROTOCOL_AND_HOST = '//ir0.mobify.com'
     
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
};

/**
 * Returns a URL suitable for use with the 'ir' service.
 */ 
var getImageURL = ResizeImages.getImageURL = function(url, options) {
    var opts = Utils.clone(defaults);
    if (options) {
        Utils.extend(opts, options);
    }

    var bits = [PROTOCOL_AND_HOST];

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
}

/**
 * Searches the collection for image elements and modifies them to use
 * the Image Resize service. Pass `options` to modify how the images are 
 * resized.
 */
ResizeImages.resize = function(imgs, options) {
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

    var attr;
    for(var i=0; i<imgs.length; i++) {
        var img = imgs[i];
        if (attr = img.getAttribute(opts.attribute)) {
            absolutify.href = attr;
            var url = absolutify.href;
            if (httpRe.test(url)) {
                img.setAttribute(opts.attribute, getImageURL(url, opts));
            }
        }
    }
    return imgs;
}

var defaults = {
      projectName: "oss-" + location.hostname.replace(/[^\w]/g, '-'),
      attribute: "x-src",
};

return ResizeImages;

});

/**
 * httpCache: An implementation of an in memory HTTP cache that persists data to
 * localStorage.
 */
define('jazzcat',["utils", "capture"], function(Utils, Capture) {

    var Jazzcat = window.Jazzcat = {};

    var get = function(key, increment) {
          // Ignore anchors.
          var resource = cache[key.split('#')[0]];

          if (resource && increment) {
              resource.lastUsed = Date.now();
              resource.useCount = resource.useCount++ || 1;
          }

          return resource;
      }

    var set = function(key, val) {
          cache[key] = val;
      }

      /**
       * Load the persistent cache into memory. Ignore stale resources.
       */
    var load = function() {
          var data = localStorage.getItem(localStorageKey)
            , key;

          if (data === null) {
              return;
          }

          try {
              data = JSON.parse(data)
          } catch(err) {
              return;
          }

          for (key in data) {
              if (data.hasOwnProperty(key) && !httpCache.utils.isStale(data[key])) {
                  set(key, data[key]);
              }
          }
      }

    /**
    * Save the in-memory cache to disk. If the disk is full, use LRU to drop
    * resources until it will fit on disk.
    */
    var save = function(callback) {
        var resources = {}
        , resource
        , attempts = 10
        , key
        , serialized
          // End of time.
        , lruTime = 9007199254740991
        , lruKey;

        for (key in cache) {
            if (cache.hasOwnProperty(key)) {
                resources[key] = cache[key]
            }
        }

        (function persist() {
            setTimeout(function() {
                try {
                    serialized = JSON.stringify(resources);
                } catch(err) {
                    if (callback) callback(err);
                    return;
                }

                try {
                    localStorage.setItem(localStorageKey, serialized)
                } catch(err) {
                    if (!--attempts) {
                        if (callback) callback(err);
                        return;
                    }

                    for (key in resources) {
                        if (!resources.hasOwnProperty(key)) continue;
                        resource = resources[key]

                        // Nominate the LRU.
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
                    persist();
                    return;
                }

                if (callback) callback();

            }, 0);
        })();
    };

    var reset = function(val) {
        cache = val || {};
    };

    var localStorageKey = 'Mobify-Combo-Cache-v1.0';

    // In memory cache.
    var cache = {};

    Jazzcat.httpCache = {
          get: get
        , set: set
        , load: load
        , save: save
        , reset: reset
        , cache: cache
    };


    /**
     * httpCache.utils: HTTP 1.1 Caching header helpers.
     */
    /**
    * Regular expressions for cache-control directives.
    * See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9
    */
    var ccDirectives = /^\s*(public|private|no-cache|no-store)\s*$/
    var ccMaxAge = /^\s*(max-age)\s*=\s*(\d+)\s*$/

    /**
     * Returns an object representing a parsed HTTP 1.1 Cache-Control directive.
     * The object may contain the following relevant cache-control properties:
     * - public
     * - private
     * - no-cache
     * - no-store
     * - max-age
     */
    var ccParse = function (directives) {
        var obj = {}
          , match;

        directives.split(',').forEach(function(directive) {
            if (match = ccDirectives.exec(directive)) {
                obj[match[1]] = true
            } else if (match = ccMaxAge.exec(directive)) {
                obj[match[1]] = parseInt(match[2])
            }
        });

        return obj;
    };

    var utils = Jazzcat.httpCache.utils = {
        /**
         * Returns a data URI for `resource` suitable for executing the script.
         */
        dataURI: function(resource) {
            var contentType = resource.headers['content-type'] || 'application/x-javascript'
            return 'data:' + contentType + (!resource.text
                 ? (';base64,' + resource.body)
                 : (',' + encodeURIComponent(resource.body)));
        },

        /**
         * Returns `true` if `resource` is stale by HTTP/1.1 caching rules.
         * Treats invalid headers as stale.
         */
        isStale: function(resource) {
            var headers = resource.headers || {}
              , cacheControl = headers['cache-control']
              , now = Date.now()
              , date
              , expires;

            // If `max-age` and `date` are present, and no other no other cache 
            // directives exist, then we are stale if we are older.
            if (cacheControl && (date = Date.parse(headers.date))) {
                cacheControl = ccParse(cacheControl);

                if ((cacheControl['max-age']) && 
                    (!cacheControl['private']) &&
                    (!cacheControl['no-store']) &&
                    (!cacheControl['no-cache'])) {
                    // Convert the max-age directive to ms.
                    return now > (date + (cacheControl['max-age'] * 1000));
                }
            }

            // If `expires` is present, we are stale if we are older.
            if (expires = Date.parse(headers.expires)) {
                return now > expires;
            }

            // Otherwise, we are stale.
            return true;
        }
    };


      /**
      * combineScripts: Clientside API to the combo service.
      */
    var httpCache = Jazzcat.httpCache;

    var absolutify = document.createElement('a')

    Jazzcat.combineScripts = function(scripts, options) {
        var opts;
        if (options) {
            opts = Utils.extend(defaults, options);
        } else {
            opts = defaults;
        }

        // Fastfail if there are no scripts or if required modules are missing.
        if (!scripts.length || !window.localStorage || !window.JSON) {
            return scripts;
        }

        var url
          , i
          , ii
          , isCached;

        httpCache.load();

        for (i = 0, ii=scripts.length; i<ii; i++) {
            var script = scripts[i];
            if (!script.hasAttribute(opts.attribute)) continue;

            absolutify.href = script.getAttribute(opts.attribute);
            url = absolutify.href;

            script.removeAttribute(opts.attribute);
            isCached = !!httpCache.get(url);
            script.innerHTML = isCached + ',' + opts.execCallback
                + "('" + url + "'," + (!!opts.forceDataURI) + ");";
        }
        
        return scripts;
    };

    var defaults = Jazzcat.combineScripts.defaults = {
            selector: 'script'
          , attribute: 'x-src'
          , proto: '//'
          , host: 'jazzcat.mobify.com'
          , endpoint: 'jsonp'
          , execCallback: 'Jazzcat.combo.exec'
          , loadCallback: 'Jazzcat.combo.load'
          , projectName: ''
    };

    Jazzcat.combo = {
        /**
         * Emit a <script> tag to execute the contents of `url` using 
         * `document.write`. Prefer loading contents from cache.
         */
        exec: function(url, useDataURI) {
            var resource = httpCache.get(url, true),
                out;
                
            if (!resource) {
                out = 'src="' + url + '">';
            } else {
                out = 'data-orig-src="' + url + '"';

                if (useDataURI) {
                    out += ' src="' + httpCache.utils.dataURI(resource) + '">';
                } else {
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
                    out += '>' + resource.body.replace(/(<\/scr)(ipt\s*>)/ig, '$1\\$2');
                }
            }

            document.write('<script ' + out + '<\/script>');
        },

        /**
         * Callback for loading the httpCache and storing the results of a combo
         * query.
         */
        load: function(resources) {
            var resource, i, ii, save = false;
            
            httpCache.load()

            if (!resources) return;

            for (i = 0,ii=resources.length; i<ii; i++) {
                resource = resources[i];
                if (resource.status == 'ready') {
                    save = true;
                    httpCache.set(encodeURI(resource.url), resource)
                }
            }

            if (save) httpCache.save();
        },

        getLoaderScript: function(uncached, loadCallback) {
            var bootstrap = document.createElement('script')
            if (uncached.length) {
                bootstrap.src = Jazzcat.getURL(uncached, loadCallback);
            } else {
                bootstrap.innerHTML = loadCallback + '();';
            }
            return bootstrap;
        }
    };

    /**
     * Returns a URL suitable for use with the combo service. Sorted to generate
     * consistent URLs.
     */
    Jazzcat.getURL = function(urls, callback) {
        return defaults.proto + defaults.host + 
          (defaults.projectName ? '/project-' + defaults.projectName : '') + 
          '/' + defaults.endpoint + '/' + callback + '/' + 
          Jazzcat.JSONURIencode(urls.slice().sort());
    };

    Jazzcat.JSONURIencode = function(obj) {
        return encodeURIComponent(JSON.stringify(obj));
    };

    // Mobify.cssURL = function(obj) {
    //     return '//combo.mobify.com/css/' + JSONURIencode(obj)
    // }


    var oldEnable = Capture.enable;
    var enablingRe = new RegExp("<script[^>]*?>(true|false),"
      + defaults.execCallback.replace(/\./g, '\\.')
      + "\\('([\\s\\S]*?)'\\,(true|false)\\);<\\/script", "gi");

    /**
     * Overrides enable to replace scripts with bootloaders
     */
    Capture.enable = function() {
        var match
        , bootstrap
        , firstIndex = -1
        , uncached = []
        , htmlStr = oldEnable.apply(Capture, arguments);

        while (match = enablingRe.exec(htmlStr)) {
          if (firstIndex == -1) firstIndex = match.index;
          if (match[1] === "false") uncached.push(match[2]);
        }
        if (firstIndex == -1) return htmlStr;

        bootstrap = Jazzcat.combo.getLoaderScript(uncached, defaults.loadCallback);

        return htmlStr.substr(0, firstIndex) + bootstrap.outerHTML + htmlStr.substr(firstIndex);
    };


    return Jazzcat;

});

define('unblockify',["utils", "capture"], function(Utils, Capture) {

var Unblockify = {}

// Moves all scripts to the end of body by overriding insertMobifyScripts
Unblockify.moveScripts = function(doc) {
    var scripts = Utils.removeBySelector("script", doc);
    for (var i=0,ii=scripts.length; i<ii; i++) {
        var script = scripts[i];
        doc.body.appendChild(script);
    }
};


Unblockify.unblock = function() {

    // Grab reference to old insertMobifyScripts method
    var oldInsert = Capture.prototype.insertMobifyScripts;

    // Override insertMobifyScripts to also move the scripts
    // to the end of the body
    Capture.prototype.insertMobifyScripts = function() {
        oldInsert.call(this);

        var doc = this.capturedDoc;
        Unblockify.moveScripts(doc);
    };
}

return Unblockify;

});
require(["utils", "capture", "resizeImages", "jazzcat", "unblockify"], function(Utils, Capture, ResizeImages, Jazzcat, Unblockify) {
    Mobify.Utils = Utils;
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;
    Mobify.Jazzcat = Jazzcat;
    Mobify.Unblockify = Unblockify;
    Mobify.api = "2.0"; // v6 tag backwards compatibility change
    return Mobify

}, undefined, true);
// relPath, forceSync;
define("mobify-full", function(){});
}());