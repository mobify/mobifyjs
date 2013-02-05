(function () {
/**
 * almond 0.2.3 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
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
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
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

var extend = Utils.extend = function(target){
    [].slice.call(arguments, 1).forEach(function(source) {
      for (key in source)
          if (source[key] !== undefined)
              target[key] = source[key];
    }); 
    return target;
};

var keys = Utils.keys = function(obj) {
    var result = []; 
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
          result.push(key);
    }   
    return result;
};  

var values = Utils.values = function(obj) {
    var result = []; 
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
          result.push(obj[key]);
    }   
    return result;
};

return Utils;

});
define('capture',["utils"], function(Utils) {

// ##
// # Regex Setup
// ##


var Capture = {};

var openingScriptRe = new RegExp('(<script[\\s\\S]*?>)', 'gi');

// Inline styles are scripts are disabled using a unknown type.
var tagDisablers = {
        style: ' media="mobify-media"',
        script: ' type="text/mobify-script"'
    };

var tagEnablingRe = new RegExp(Utils.values(tagDisablers).join('|'), 'g');

// sj: TODO: Make this configurable? Also make x- prefix configurable
var disablingMap = { 
        img:    ['src', 'height', 'width'],
        iframe: ['src'],
        script: ['src', 'type'],
        link:   ['href'],
        style:  ['media'], // sj: Why?
    };

var affectedTagRe = new RegExp('<(' + Utils.keys(disablingMap).join('|') + ')([\\s\\S]*?)>', 'gi');
var attributeDisablingRes = {};
var attributesToEnable = {};
var attributeEnablingRe;

// Populate `attributesToEnable` and `attributesToEnable`.
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

// sj: WHY do we need to generate a regexp object here? 
//     Hmmm probably makes it easier to add new tags/attributes in the future...
attributeEnablingRe = new RegExp('\\sx-(' + Utils.keys(attributesToEnable).join('|') + ')', 'gi');

// ##
// # Private Methods
// ##

/**
 * Disables all attributes in disablingMap by prepending x-
 */
var disableAttributes = function(whole, tagName, tail) {
    tagName = tagName.toLowerCase();
    return result = '<' + tagName + (tagDisablers[tagName] || '')
        + tail.replace(attributeDisablingRes[tagName], ' x-$1') + '>';
}

/**
 * Returns a string with all external attributes disabled.
 * Includes special handling for resources referenced in scripts and inside
 * comments.
 */
var disable = Capture.disable = function(htmlStr) {            
    var splitRe = /(<!--[\s\S]*?-->)|(?=<\/script)/i
      , tokens = htmlStr.split(splitRe)
      , ret = tokens.map(function(fragment) {
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
 */
var enable = Capture.enable = function(htmlStr) {
    return htmlStr.replace(attributeEnablingRe, ' $1').replace(tagEnablingRe, '');
};

// extractHTML

var nodeName = function(node) {
    return node.nodeName.toLowerCase();
};

var escapeQuote = function(s) {
    return s.replace('"', '&quot;');
};

/**
 * Return a string for the opening tag of DOMElement `element`.
 */
var openTag = Capture.openTag = function(element) {
    if (!element) return '';
    if (element.length) element = element[0];

    var stringBuffer = [];

    [].forEach.call(element.attributes, function(attr) {
        stringBuffer.push(' ', attr.name, '="', escapeQuote(attr.value), '"');
    })

    return '<' + nodeName(element) + stringBuffer.join('') + '>';
};

/**
 * Return a string for the closing tag of DOMElement `element`.
 */
var closeTag = Capture.closeTag = function(element) {
    if (!element) return '';
    if (element.length) element = element[0];

    return '</' + nodeName(element) + '>';
};

/**
 * Return a string for the doctype of the current document.
 */
var doctype = function() {
    var doctypeEl = document.doctype || [].filter.call(document.childNodes, function(el) {
            return el.nodeType == Node.DOCUMENT_TYPE_NODE
        })[0];

    if (!doctypeEl) return '';

    return '<!DOCTYPE HTML'
        + (doctypeEl.publicId ? ' PUBLIC "' + doctypeEl.publicId + '"' : '')
        + (doctypeEl.systemId ? ' "' + doctypeEl.systemId + '"' : '')
        + '>';
};

// outerHTML polyfill - https://gist.github.com/889005
var outerHTML = function(el, _doc){
    var doc = _doc || document;
    var div = doc.createElement('div');
    div.appendChild(el.cloneNode(true));
    var contents = div.innerHTML;
    div = null;
    return contents;
}

/**
 * Returns a string of the unesacped content from a plaintext escaped `container`.
 */
var extractHTMLStringFromElement = function(container) {
    if (!container) return '';

    return [].map.call(container.childNodes, function(el) {
        var tagName = nodeName(el);
        if (tagName == '#comment') return '<!--' + el.textContent + '-->';
        if (tagName == 'plaintext') return el.textContent;
        // Don't allow mobify related scripts to be added to the new document
        if (tagName == 'script' && el.getAttribute("class") == "mobify" ){
            return '';
        }
        return el.outerHTML || el.nodeValue || outerHTML(el);
    }).join('');
};

// Memoize result of extract
var captured;

/**
 * Returns an object containing the state of the original page. Caches the object
 * in `extractedHTML` for later use.
 */
var captureSourceDocumentFragments = function(_doc) {
    if (captured) return captured;

    var doc = _doc || document;
    var headEl = doc.getElementsByTagName('head')[0] || doc.createElement('head');
    var bodyEl = doc.getElementsByTagName('body')[0] || doc.createElement('body');
    var htmlEl = doc.getElementsByTagName('html')[0];

    captured = {
        doctype: doctype(),
        htmlTag: openTag(htmlEl),
        headTag: openTag(headEl),
        bodyTag: openTag(bodyEl),
        headContent: extractHTMLStringFromElement(headEl),
        bodyContent: extractHTMLStringFromElement(bodyEl)
    };

    /**
     * RR: I assume that Mobify escaping tag is placed in <head>. If so, the <plaintext>
     * it emits would capture the </head><body> boundary, as well as closing </body></html>
     * Therefore, bodyContent will have these tags, and they do not need to be added to .all()
     */
    captured.all = function(inject) {
        return this.doctype + this.htmlTag + this.headTag + (inject || '') + this.headContent + this.bodyContent;
    }

    // During capturing, we will usually end up hiding our </head>/<body ... > boundary
    // within <plaintext> capturing element. To construct source DOM, we need to rejoin
    // head and body content, iterate through it to find head/body boundary and expose
    // opening <body ... > tag as a string.

    // Consume comments without grouping to avoid catching
    // <body> inside a comment, common with IE conditional comments.
    var bodySnatcher = /<!--(?:[\s\S]*?)-->|(<\/head\s*>|<body[\s\S]*$)/gi;

    captured = Utils.extend({}, captured);
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
                captured.bodyTag = parseBodyTag[1];
                captured.bodyContent = parseBodyTag[2];
            }
            break;
        }
    }
    return captured;
};

/**
 * Setup unmobifier
 */
var unmobify = function() {
    if (/complete|loaded/.test(document.readyState)) {
        unmobifier();
    } else {
        document.addEventListener('DOMContentLoaded', unmobifier, false);
    }
};

/** 
 * Gather escaped content from the DOM, unescaped it, and then use 
 * `document.write` to revert to the original page.
 */
var unmobifier = function() {
    document.removeEventListener('DOMContentLoaded', unmobifier, false);
    var captured = extractSourceHTMLStrings();

    // Wait up for IE, which may not be ready to.
    setTimeout(function() {
        document.open();
        document.write(captured.all(inject));
        document.close();
    }, 15);
};

/**
 * Transform a string <tag attr="value" ...></tag> into corresponding DOM element
 */
var cloneAttributes = function(sourceString, dest) {
    var match = sourceString.match(/^<(\w+)([\s\S]*)$/i);
    var div = document.createElement('div');
    div.innerHTML = '<div' + match[2];

    [].forEach.call(div.firstChild.attributes, function(attr) {
        dest.setAttribute(attr.nodeName, attr.nodeValue);
    }); 

    return dest;
}; 

/**
 * Set the content of an element with html from a string
 */
var setElementContentFromString = function(el, htmlString, _doc) {
    // We must pass in document because elements created for dom insertion must be
    // inserted into the same dom they are created by.
    var doc = _doc || document;
    var div = doc.createElement('div'); // TODO: Memoize
    for (div.innerHTML = htmlString; div.firstChild; el.appendChild(div.firstChild));
};

var documentObj; // Cache document object
/**
 * 1. Get the original markup from the document.
 * 2. Disable the markup.
 * 3. Construct the source DOM.    
 */
var createDocumentFromSource = Capture.createDocumentFromSource = function(_doc) {
    if (documentObj) return documentObj;
    // Extract escaped markup out of the DOM
    var captured = captureSourceDocumentFragments(_doc);
    
    // create source document
    var docObj = {};
    var sourceDoc = docObj.sourceDoc = document.implementation.createHTMLDocument("")
    var htmlEl = docObj.htmlEl = sourceDoc.documentElement;
    var headEl = docObj.headEl = htmlEl.firstChild;
    var bodyEl = docObj.bodyEl = htmlEl.lastChild;

    // Reconstruct html, body, and head with the same attributes as the original document
    cloneAttributes(captured.htmlTag, htmlEl);
    cloneAttributes(captured.headTag, headEl);
    cloneAttributes(captured.bodyTag, bodyEl);

    // Set innerHTML of new source DOM body
    bodyEl.innerHTML = disable(captured.bodyContent);
    var disabledHeadContent = disable(captured.headContent);
    try {
        headEl.innerHTML = disabledHeadContent;
    } catch (e) {
        // On some browsers, you cannot modify <head> using innerHTML.
        // In that case, do a manual copy of each element
        var title = headEl.getElementsByTagName('title')[0];
        title && headEl.removeChild(title);
        setElementContentFromString(headEl, disabledHeadContent, sourceDoc);
    }

    // Append head and body to the html element
    htmlEl.appendChild(headEl);
    htmlEl.appendChild(bodyEl);

    documentObj = docObj;
    return docObj;
};

/**
 * Grabs source DOM as a new document object - TODO: Remove Zepto to make this true!
 */
var getCaptureDoc = Capture.getCaptureDoc = function() {
    return createDocumentFromSource().sourceDoc;;
};

/**
 * Returns an escaped HTML representation of the source DOM
 */
var escapedHtmlString = Capture.escapedHtmlString =  function(_doc) {
    var doc = _doc || getCaptureDoc();
    return enable(doc.documentElement.outerHTML || outerHTML(doc.documentElement));
};

/**
 * Rewrite the document with a new html string
 */
var render = Capture.render = function(htmlString, _doc, callback) {
    var doc = _doc || document;

    // Set capturing state to false so that the user main code knows how to execute
    capturing = false;
    
    window.setTimeout(function(){
        doc.open();
        doc.write(htmlString);
        doc.close();
        callback && callback();
    });
};

/**
 * Grab the source document and render it
 */
var renderCaptureDoc = Capture.renderCaptureDoc = function(options) {
    // Objects are blown away on FF after document.write, but not in Chrome.
    // To get around this, we re-inject the mobify.js libray by re-adding
    // this script back into the DOM to be re-executed post processing (FF Only)
    // aka new Ark :)
    var doc = getCaptureDoc(); // should be cached

    if (!/webkit/i.test(navigator.userAgent)) {
        // Create script with the mobify library
        var injectScript = doc.createElement("script");
        injectScript.id = "mobify-js-library"
        injectScript.type = "text/javascript";
        injectScript.innerHTML = window.library;

        // insert at the top of head
        var head = createDocumentFromSource().headEl;
        var firstChild = head.firstChild;
        head.insertBefore(injectScript, firstChild)
    }

    if (options && options.injectMain) {
        // Grab main from the original document and stick it into source dom
        // at the end of body
        var main = document.getElementById("mobify-js-main");
        // Since you can't move nodes from one document to another,
        // we must clone it first using importNode:
        // https://developer.mozilla.org/en-US/docs/DOM/document.importNode
        var mainClone = doc.importNode(main, false);
        createDocumentFromSource().bodyEl.appendChild(mainClone);
        
    }

    render(escapedHtmlString());
};

return Capture;

});

define('resizeImages',["utils"], function(Utils) {

var ResizeImages = {}

var absolutify = document.createElement('a')

// A regex for detecting http(s) URLs.
var httpRe = /^https?/

// A protocol relative URL for the host ir0.mobify.com.
var PROTOCOL_AND_HOST = '//ir0.mobify.com'
          
/**
 * Returns a URL suitable for use with the 'ir' service.
 */ 
var getImageURL = ResizeImages.getImageURL = function(url, options) {
    options = options || {}

    var bits = [PROTOCOL_AND_HOST];

    if (defaults.projectName) {
        var projectId = "project-" + defaults.projectName;
        bits.push(projectId);
    }

    if (options.format) {
        bits.push(options.format + (options.quality || ''));
    }

    if (options.maxWidth) {
        bits.push(options.maxWidth)

        if (options.maxHeight) {
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
var resizeImages = ResizeImages.resize = function(document, options) {
    var opts;
    if (typeof options == 'object') {
        opts = Utils.extend(defaults, options);
    } else {
        opts = defaults;
    }
    var dpr = window.devicePixelRatio;
    var imgs = document.querySelectorAll(opts.selector);
    var attr;

    if (typeof options == 'number') {
        opts.maxWidth = Math.floor(options);
    }

    if (dpr) {
        if (opts.maxWidth) {
            opts.maxWidth = Math.ceil(opts.maxWidth * dpr);
        }

        if (opts.maxHeight) {
            opts.maxHeight = Math.ceil(opts.maxHeight * dpr);
        }
    }

    for(var i=0; i<imgs.length; i++) {
        var img = imgs[i];
        if (attr = img.getAttribute(opts.attribute)) {
            absolutify.href = attr;
            var url = absolutify.href;
            if (httpRe.test(url)) {
                img.setAttribute('x-src', getImageURL(url, opts));
            }
        }
    }
    return imgs;
}

var defaults = resizeImages.defaults = {
        selector: 'img'
      , attribute: 'x-src'
      , projectName: ''
    };

return ResizeImages;

});

require(["capture", "resizeImages"], function(Capture, ResizeImages) {
    var Mobify = window.Mobify = window.Mobify || {};
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;
    return Mobify
}, undefined, true);
// relPath, forceSync
;
define("mobify-resizeImages", function(){});
}());