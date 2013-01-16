define("capture", ["Zepto"], function($) {

// ##
// # Utility methods - TODO: Break into seperate utils.js
// ##

var extend = function(target){
    [].slice.call(arguments, 1).forEach(function(source) {
      for (key in source)
          if (source[key] !== undefined)
              target[key] = source[key];
    }); 
    return target;
};

var keys = function(obj) {
    var result = []; 
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
          result.push(key);
    }   
    return result;
};  

var values = function(obj) {
    var result = []; 
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
          result.push(obj[key]);
    }   
    return result;
};

// ##
// # Regex Setup
// ##

var openingScriptRe = new RegExp('(<script[\\s\\S]*?>)', 'gi');

// Inline styles are scripts are disabled using a unknown type.
var tagDisablers = {
        style: ' media="mobify-media"',
        script: ' type="text/mobify-script"'
    };

var tagEnablingRe = new RegExp(values(tagDisablers).join('|'), 'g');

// sj: TODO: Make this configurable? Also make x- prefix configurable
var disablingMap = { 
        img:    ['src', 'height', 'width'],
        iframe: ['src'],
        script: ['src', 'type'],
        link:   ['href'],
        style:  ['media'],
    };

var affectedTagRe = new RegExp('<(' + keys(disablingMap).join('|') + ')([\\s\\S]*?)>', 'gi');
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
attributeEnablingRe = new RegExp('\\sx-(' + keys(attributesToEnable).join('|') + ')', 'gi');

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
var disable = function(htmlStr) {            
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
}


/**
 * Returns a string with all disabled external attributes enabled.
 */
var enable = function(htmlStr) {
    return htmlStr.replace(attributeEnablingRe, ' $1').replace(tagEnablingRe, '');
}

// extractHTML

var nodeName = function(node) {
        return node.nodeName.toLowerCase();
    }

var escapeQuote = function(s) {
        return s.replace('"', '&quot;');
    }

/**
 * Return a string for the opening tag of DOMElement `element`.
 */
var openTag = function(element) {
    if (!element) return '';
    if (element.length) element = element[0];

    var stringBuffer = [];

    [].forEach.call(element.attributes, function(attr) {
        stringBuffer.push(' ', attr.name, '="', escapeQuote(attr.value), '"');
    })

    return '<' + nodeName(element) + stringBuffer.join('') + '>';
}

/**
 * Return a string for the closing tag of DOMElement `element`.
 */
var closeTag = function(element) {
    if (!element) return '';
    if (element.length) element = element[0];

    return '</' + nodeName(element) + '>';
}

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
        if (tagName == 'script' && ((/mobify\./.test(el.src) || /Mobify/.test(el.textContent)))) return '';
        return el.outerHTML || el.nodeValue;
    }).join('');
}

// Memoize result of extract
var captured;

/**
 * Returns an object containing the state of the original page. Caches the object
 * in `extractedHTML` for later use.
 */
var captureSourceHTMLFromPlaintext = function() {
    if (captured) return captured;

    var headEl = document.getElementsByTagName('head')[0] || document.createElement('head')
      , bodyEl = document.getElementsByTagName('body')[0] || document.createElement('body')
      , htmlEl = document.getElementsByTagName('html')[0];

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

    captured = extend({}, captured);
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
}

/**
 * Setup unmobifier
 */
var unmobify = function() {
    if (/complete|loaded/.test(document.readyState)) {
        unmobifier();
    } else {
        document.addEventListener('DOMContentLoaded', unmobifier, false);
    }
}

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
    }

/**
 * Transform a string <tag attr="value" ...></tag> into corresponding DOM element
 */
var createElementFromString = function(htmlString) {
    var match = htmlString.match(/^<(\w+)([\s\S]*)/i);
    var div = document.createElement('div');
    div.innerHTML = '<div' + match[2];

    // Create the element we want to return
    var el = document.createElement(match[1]);

    // Set correct attributes on el from the string
    var attributes = div.firstChild.attributes;
    for (var i=0; i<attributes.length; i++) {
        el.setAttribute(attributes[i].nodeName, attributes[i].nodeValue);
    }
    return el;
};

/**
 * Set the content of an element with html from a string
 */
var setElementContentFromString = function(el, htmlString) {
    var div = document.createElement('div'); // TODO: Memoize
    for (div.innerHTML = htmlString; div.firstChild; el.appendChild(div.firstChild));
};

/**
 * 1. Get the original markup from the document.
 * 2. Disable the markup.
 * 3. Construct the source DOM.    
 */
var extractDOM = function() {
    // Extract escaped markup out of the DOM
    var captured = captureSourceHTMLFromPlaintext();
    
    // Reconstruct html, body, and head with the same attributes as the original document
    var htmlEl = createElementFromString(captured.htmlTag);
    var headEl = createElementFromString(captured.headTag);
    var bodyEl = createElementFromString(captured.bodyTag);

    // Set innerHTML of new source DOM body and head
    bodyEl.innerHTML = disable(captured.bodyContent);
    headEl.innerHTML = disable(captured.headContent);

    // Append head and body to the html element
    htmlEl.appendChild(headEl);
    htmlEl.appendChild(bodyEl);

    return {
        'doctype' : captured.doctype,
        '$html' : $(htmlEl)
    };
};

// ##
// # Public methods
// ##

var Capture = {}

/**
 * Grabs source DOM as a new document object - TODO: Remove Zepto to make this true!
 */
var getSourceDOM = Capture.getSourceDOM = function() {
        if (!Capture.capturedDOM) {
            var capturedDOM = Capture.capturedDOM = extractDOM()['$html'];
        }
        return Capture.capturedDOM;
    };

/**
 * Returns an unescaped HTML representation of the source DOM
 */
var unescapedHtmlString = Capture.unescapedHtmlString = function() {
        return getSourceDOM()[0].outerHTML;
    };

/**
 * Returns an escaped HTML representation of the source DOM
 */
var escapedHtmlString = Capture.escapedHtmlString =  function() {
        return enable(unescapedHtmlString());
    };

/**
 * Rewrite the document with a new html string
 */
var render = Capture.render = function(htmlString) {
    window.setTimeout(function(){
        document.open();
        document.write(htmlString);
        document.close();
    });
};

/**
 * Grab the source DOM and render it
 */
var renderSourceDOM = Capture.renderSourceDOM = function(options) {
    // Objects are blown away on FF after document.write, but not in Chrome.
    // To get around this, we re-inject the mobify.js libray by re-adding
    // this script back into the DOM to be re-executed post processing (FF Only)
    // aka new Ark :)
    if (!/webkit/i.test(navigator.userAgent)) {
        var injectScript = "<script id=\"mobifyjs\" type=\"text/javascript\">" + window.library + "</scr" + "ipt>";
        getSourceDOM().find("body").prepend(injectScript);
    }

    // Remove main, and if it should be reinjected, append it as the last child of body
    var main = getSourceDOM().find("#mobify-js-main");
    if (options.injectMain) {
        getSourceDOM().find("body").append(main[0].outerHTML);
    }
    main.remove();

    // Set capturing state to false so that the user main code knows how to execute
    capturing = false;

    render(escapedHtmlString());
};

return Capture;

});
