define(["utils"], function(Utils) {

// ##
// # Static Variables/Functions
// ##

var openingScriptRe = /(<script[\s\S]*?>)/gi;

// Inline styles are scripts are disabled using a unknown type.
var tagDisablers = {
    style: ' media="mobify-media"',
    script: ' type="text/mobify-script"'
};

var tagEnablingRe = new RegExp(Utils.values(tagDisablers).join('|'), 'g');

// Map of all attributes we should disable (to prevent resources from downloading)
var disablingMap = { 
    img:    ['src', 'height', 'width'],
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
 * outerHTML polyfill - https://gist.github.com/889005
 */
function outerHTML(el){
    var div = document.createElement('div');
    div.appendChild(el.cloneNode(true));
    var contents = div.innerHTML;
    div = null;
    return contents;
}

/**
 * Returns a string of the unescaped content from a plaintext escaped `container`.
 */
function extractHTMLStringFromElement(container) {
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
}

// cached div used repeatedly to create new elements
var cachedDiv = document.createElement('div');

/**
 * Transform a string <tag attr="value" ...></tag> into corresponding DOM element
 */
function deserializeString(sourceString, dest) {
    var match = sourceString.match(/^<(\w+)([\s\S]*)$/i);
    cachedDiv.innerHTML = '<div' + match[2];

    [].forEach.call(cachedDiv.firstChild.attributes, function(attr) {
        dest.setAttribute(attr.nodeName, attr.nodeValue);
    }); 

    return dest;
};

// ##
// # Constructor
// ##
var Capture = function(doc, prefix) {
    this.doc = doc || document;
    this.prefix = prefix || "x-";

    var capturedStringFragments = this.createDocumentFragmentsStrings();
    Utils.extend(this, capturedStringFragments);

    var capturedDOMFragments = this.createDocumentFragments();
    Utils.extend(this, capturedDOMFragments);
};


/**
 * Returns a string with all external attributes disabled.
 * Includes special handling for resources referenced in scripts and inside
 * comments.
 * Not declared on the prototype so it can be used as a static method.
 */
var disable = Capture.disable = function(htmlStr, prefix) {   
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
var enable = Capture.enable = function(htmlStr, prefix) {
    var attributeEnablingRe = new RegExp('\\s' + prefix + '(' + Utils.keys(attributesToEnable).join('|') + ')', 'gi');
    return htmlStr.replace(attributeEnablingRe, ' $1').replace(tagEnablingRe, '');
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
        htmlOpenTag: openTag(htmlEl),
        headOpenTag: openTag(headEl),
        bodyOpenTag: openTag(bodyEl),
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
    if (/complete|loaded/.test(document.readyState)) {
        document.removeEventListener('DOMContentLoaded', this.restorer, false);

        var self = this;
        setTimeout(function() {
            document.open();
            document.write(self.all());
            document.close();
        }, 15);
    } else {
        document.addEventListener('DOMContentLoaded', this.restorer, false);
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
    deserializeString(this.htmlOpenTag, htmlEl);
    deserializeString(this.headOpenTag, headEl);
    deserializeString(this.bodyOpenTag, bodyEl);

    // Set innerHTML of new source DOM body
    bodyEl.innerHTML = disable(this.bodyContent, this.prefix);
    var disabledHeadContent = disable(this.headContent, this.prefix);

    // On some browsers, you cannot modify <head> using innerHTML.
    // In that case, do a manual copy of each element
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
    var html = enable(doc.documentElement.outerHTML || outerHTML(doc.documentElement), this.prefix);
    var htmlWithDoctype = this.doctype + html;
    return htmlWithDoctype;
};

/**
 * Rewrite the document with a new html string
 */
Capture.prototype.render = function(htmlString) {
    var doc = this.doc;

    // Set capturing state to false so that the user main code knows how to execute
    capturing = false;

    // Asynchronously render the new document
    setTimeout(function(){
        doc.open();
        doc.write(htmlString);
        doc.close();
    });
};

/**
 * Grab the source document and render it
 */
Capture.prototype.renderCapturedDoc = function(options) {
    var doc = this.capturedDoc;

    // After document.open(), all objects will be removed. 
    // To provide our library functionality afterwards, we
    // must re-inject the script.
    var mobifyjsScript = document.getElementById("mobify-js-library");
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

    // Inject timing point (because of blowing away objects on document.write)
    var body = this.bodyEl;
    var date = doc.createElement("div");
    date.id = "mobify-point";
    date.setAttribute("style", "display: none;")
    date.innerHTML = window.Mobify.points[0];
    body.insertBefore(date, body.firstChild);


    this.render(this.escapedHTMLString());
};

return Capture;

});
