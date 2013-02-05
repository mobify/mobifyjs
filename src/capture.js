define(["utils"], function(Utils) {

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
