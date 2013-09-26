define(["mobifyjs/utils"], function(Utils) {

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

/**
 * Takes a method name and applies that methon on a source object and overrides
 * it to call the method on a destination object with the same arguments 
 * (in addition to calling the method on the source object)
 */
var callMethodOnDestObjFromSourceObj = function(srcObj, destObj, method) {
    var oldMethod = srcObj[method];
    if (!oldMethod) {
        return;
    }
    srcObj[method] = function() {
        oldMethod.apply(srcObj, arguments);
        destObj[method].apply(destObj, arguments);
    };
}

/**
 * Creates an iframe and makes it as seamless as possible through CSS
 * TODO: Test out Seamless attribute when available in latest browsers
 */
var createSeamlessIframe = function(doc){
    var doc = doc || document;
    var iframe = doc.createElement("iframe");
    // set attribute to make the iframe appear seamless to the user
    iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;box-sizing:border-box;padding:0px;margin:0px;background-color: transparent;border: 0px none transparent;'
    iframe.setAttribute('seamless', '');
    return iframe;
}

// cached div used repeatedly to create new elements
var cachedDiv = document.createElement('div');

// ##
// # Constructor
// ##
var Capture = function(sourceDoc, prefix) {
    this.sourceDoc = sourceDoc;
    this.prefix = prefix || "x-";
    if (window.Mobify) window.Mobify.prefix = this.prefix;
};

/**
 * Initiate a buffered capture. `init` is an alias to `initCapture` for
 * backwards compatibility.
 */
Capture.init = Capture.initCapture = function(callback, doc, prefix) {
    var doc = doc || document;

    var createCapture = function(callback, doc, prefix) {
        var capture = new Capture(doc, prefix);
        var capturedStringFragments = capture.createDocumentFragmentsStrings();
        Utils.extend(capture, capturedStringFragments);
        var capturedDOMFragments = capture.createDocumentFragments();
        Utils.extend(capture, capturedDOMFragments);
        callback(capture);
    }

    if (Utils.domIsReady(doc)) {
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
 * Streaming capturing is a batsh*t loco insane way of being able to modify
 * streaming chunks of markup before the browser can request resources.
 * There are two key things to note when reading this code:
 *  1. Since we use the plaintext tag to capture the markup and prevent resources
 *     from loading, we cannot simply document.write back into the main document,
 *     since whatever we `document.write` into the document will also get swallowed up
 *     by the plaintext tag. We also can't `document.open/document.write` into the main
 *     document either because document.open will blow away the current document, which
 *     would leave the plaintext object for dead. We have attempted to relocate the
 *     plaintext element into a different document to free up the main document, but
 *     this was not successful.
 *  2. We must stream into a "captured" DOM so that we can continue to chunk
 *     data while still being able to use DOM operations on each chunk.
 *     TODO: It might be nice to bypass the captured dom if someone wants to
 *           modify the markup in a streaming way with regular expressions.
 *
 * How it works
 * ============
 * As data from the server gets loaded up on the client, that data is being
 * swallowed up by the plaintext tag which was inserted into the document
 * in the bootloader mobify.js tag. With `initStreamingCapture`, we poll
 * the plaintext tag for new data. We take the delta, we rewrite all resources
 * in that delta using a regular expression to prevent it from loading resources
 * when rendered in the captured document. `chunkCallback` is then executed with
 * the captured document in order to users to make modifications to the DOM. We
 * then take the delta of this capturedDocument and render it into the
 * destination document (which by default is a "seamless" iframe).
 */
Capture.initStreamingCapture = function(chunkCallback, finishedCallback, options) {
    options = options || {};
    var prefix = options.prefix || 'x-';
    var pollInterval = options.pollInterval || 300; // milliseconds
    var sourceDoc = options.sourceDoc || document;

    // initiates capture object that will be passed to the callbacks
    var capture = new Capture(sourceDoc, prefix);

    // Grab the plaintext element from the source document
    var plaintext = sourceDoc.getElementsByTagName('plaintext')[0];
    var destDoc;
    var iframe;
    // if no destination document specified, create iframe and use its document
    if (options.destDoc) {
        destDoc = capture.destDoc = options.destDoc;
    }
    else {
        iframe = createSeamlessIframe(sourceDoc);
        sourceDoc.body.insertBefore(iframe, plaintext);
        destDoc = capture.destDoc = iframe.contentDocument;
    }
    // currently, the only way to reconstruct the destination DOM without
    // breaking script execution order is through document.write.
    // TODO: Figure out way without document.write, and then make
    //       `docWriteIntoDest` configurable through options
    var docWriteIntoDest = true;
    if (docWriteIntoDest) {
        // Open the destination document
        destDoc.open("text/html", "replace");
    }

    // Create a "captured" DOM. This is the playground DOM that the user will
    // have that will stream into the destDoc per chunk.
    // Using an iframe instead of `implementation.createHTMLDocument` because
    // you cannot document.write into a document created that way in Firefox
    var captureIframe = sourceDoc.createElement("iframe");
    captureIframe.id = 'captured-iframe';
    captureIframe.style.cssText = 'display:none;'
    sourceDoc.body.insertBefore(captureIframe, plaintext);
    var capturedDoc = capture.capturedDoc = captureIframe.contentDocument;
    capturedDoc.open("text/html", "replace");
    // Start the captured doc with the original pieces of the source doc
    var startCapturedHtml = Capture.getDoctype(sourceDoc) +
                 Capture.openTag(sourceDoc.documentElement) +
                 Capture.openTag(sourceDoc.head) +
                 // Even if there is another base tag in the site that sets
                 // target, the first one declared will be used
                 // TODO: Write tests to verify this for all of our browsers.
                 '<base target="_parent" />' +
                 // Grab and insert all existing HTML above plaintext tag
                 extractHTMLStringFromElement(sourceDoc.head);

    // insert mobify.js (and main) into captured doc
    var mobifyLibrary = Capture.getMobifyLibrary(sourceDoc);
    startCapturedHtml += Utils.outerHTML(mobifyLibrary);

    // If there is a main exec, insert it as well
    var main = Capture.getMain();
    if (main) {
        startCapturedHtml += Utils.outerHTML(main);
    }

    if (iframe) {
        // In Webkit/Blink, resources requested in a non-src iframe do not have
        // a referer attached. This is an issue for scripts like Typekit.
        // We get around this by manipulating the browsers
        // history to trick it into thinking it is an src iframe, which causes
        // the referer to be sent.
        // AKA an insane hack for an insane hack.
        try {
            iframe.contentWindow.history.replaceState({}, iframe.contentDocument.title, window.location.href);
        } catch (e) {
            // Accessing the iframes history api in Firefox throws an error. But this
            // isn't a concern since Firefox is sending the referer header correctly
            // https://bugzilla.mozilla.org/show_bug.cgi?id=591801
        }

        // If someone uses window.location to navigate, we must ensure that the
        // history in the parent window matches
        window.history.replaceState({}, iframe.contentDocument.title, window.location.href);

        // Override various history APIs in iframe and ensure that they run in
        // the parent document as well
        var iframeHistory = iframe.contentWindow.history;
        var parentHistory = window.parent.history;
        var historyMethods = ['replaceState', 'pushState', 'go', 'forward', 'back'];
        historyMethods.forEach(function(element) {
            callMethodOnDestObjFromSourceObj(iframeHistory, parentHistory, element);
        });
    }

    startCapturedHtml = Capture.disable(startCapturedHtml, prefix);

    // Start the captured doc off write! (pun intended)
    capturedDoc.write(startCapturedHtml);

    // Track what has been written to captured and destination docs for each chunk
    var plaintextBuffer = '';
    var writtenToDestDoc = '';

    var pollPlaintext = function(){
        var finished = Utils.domIsReady(sourceDoc);

        // if document is ready, set finished to true for users of the API
        // to be able to act appropriately
        if (finished) {
            capture.finished = true;
        }

        var html = plaintext.textContent;
        var toWrite = html.substring(plaintextBuffer.length);

        // Only write up to the end of a tag
        // it is OK if this catches a &gt; or &lt; because we just care about
        // escaping attributes that fetch resources for this chunk
        toWrite = toWrite.substring(0, toWrite.lastIndexOf('>') + 1);

        // If there is nothing to write, return and check again.
        if (toWrite === '' && !finished) {
            setTimeout(pollPlaintext, pollInterval);
            return;
        }

        // Write our progress to plaintext buffer
        plaintextBuffer += toWrite;

        // Escape resources for chunk and remove target=self
        toWrite = Capture.disable(toWrite, prefix).replace(/target="_self"/gi, '');

        // Write escaped chunk to captured document
        capturedDoc.write(toWrite);

        if (iframe) {
            // Move certain elements that should be in the top-level document,
            // such as meta viewport tags and title tags
            var elsToMove = capturedDoc.querySelectorAll('meta, title');
            if (elsToMove.length > 0) {
                for (var i = 0, len=elsToMove.length; i < len; i++) {
                    var el = elsToMove[i];
                    // do not copy dom notes over twice
                    if (el.hasAttribute('capture-moved')) {
                        continue;
                    }
                    var elClone = sourceDoc.importNode(el, true);
                    sourceDoc.head.appendChild(elClone);    
                    el.setAttribute('capture-moved', '');
                }
            }

            // In Android 2.3, widths of iframes and cause an override of the width
            // if the html element of the top-level document. We detect for that
            // and change the width of the iframe
            if (document.documentElement.offsetWidth !== window.outerWidth) {
                var iframes = Array.prototype.slice.call(capturedDoc.querySelectorAll('iframe'));
                //Utils.removeElements(capturedDoc.querySelectorAll('iframe'));
                iframes.filter(function(iframe){
                    iframe.width = '100%';
                });
            }
            // var i = capturedDoc.createElement('iframe');
            // capturedDoc.body.appendChild(i);
        }

        // Execute chunk callback to allow users to make modifications to capturedDoc
        chunkCallback(capture);

        if (capturedDoc.documentElement) {
            // Grab outerHTML of capturedDoc and write the diff to destDoc
            capturedHtml = Utils.outerHTML(capturedDoc.documentElement);
            // we could be grabbing from a captured document that has a head and no body.
            var toWriteDest = capturedHtml.substring(writtenToDestDoc.length);

            // outerHTML will always give us an balanced tree, which isn't what
            // we want to write into the destination document. The solution for
            // this is to simply never write out closing head tags if they
            // are at the end of the `toWriteDest` string. If those end tags
            // were truly from the document, rather then generated by outerHTML,
            // then they will come in on the next chunk.
            toWriteDest = Capture.removeCloseEndTagsAtEndOfString(toWriteDest);

            writtenToDestDoc += toWriteDest;

            // Unescape chunk
            toWriteDest = Capture.enable(toWriteDest, prefix);
            if (docWriteIntoDest) {
                destDoc.write(toWriteDest);
            }
        }

        // if document is ready, stop polling and ensure all documents involved are closed
        if (finished) {
            finishedCallback && finishedCallback(capture);
            capturedDoc.close();
            destDoc.close();
            sourceDoc.close();
            // TODO: Maybe remove captured-iframe and plaintext tags when finished?
        }
        else {
            setTimeout(pollPlaintext, pollInterval);
        }
    };

    pollPlaintext();

};

/**
 * Removes all closing tags from an html string
 */
Capture.removeCloseEndTagsAtEndOfString = function(html) {
    var newHtml = undefined;
    while (newHtml !== html) {
        html = (newHtml !== undefined) ? newHtml : html;
        newHtml = html.replace(/(.*)<\/[^>]*>$/i, function(match, p1){
            return p1
        });
    }
    return newHtml;
}

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
Capture.getDoctype = function(doc) {
    var doc = doc || document;
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
 * Returns an object containing the state of the original page. Caches the object
 * in `extractedHTML` for later use.
 */
 Capture.prototype.createDocumentFragmentsStrings = function() {
    var doc = this.sourceDoc;
    var headEl = doc.getElementsByTagName('head')[0] || doc.createElement('head');
    var bodyEl = doc.getElementsByTagName('body')[0] || doc.createElement('body');
    var htmlEl = doc.getElementsByTagName('html')[0];

    captured = {
        doctype: Capture.getDoctype(doc),
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
    var doc = self.sourceDoc;

    var restore = function() {
        doc.removeEventListener('readystatechange', restore, false);

        setTimeout(function() {
            doc.open();
            doc.write(self.all());
            doc.close();
        }, 15);
    };

    if (Utils.domIsReady(doc)) {
        restore();
    } else {
        doc.addEventListener('readystatechange', restore, false);
    }
};

/**
 * Set the content of an element with html from a string
 */
Capture.prototype.setElementContentFromString = function(el, htmlString) {
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
    var html = Capture.enable(Utils.outerHTML(doc.documentElement), this.prefix);
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

    var doc = this.sourceDoc;

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

Capture.getMobifyLibrary = function(doc) {
    var doc = doc || document;
    var mobifyjsScript = doc.getElementById("mobify-js");

    // v6 tag backwards compatibility change
    if (!mobifyjsScript) {
        mobifyjsScript = doc.getElementsByTagName("script")[0];
        mobifyjsScript.id = "mobify-js";
        mobifyjsScript.setAttribute("class", "mobify");
    }

    return mobifyjsScript;
};

Capture.getMain = function(doc) {
    var doc = doc || document;
    var mainScript = undefined;
    if (window.Mobify && window.Mobify.mainExecutable) {
        mainScript = document.createElement('script');
        mainScript.innerHTML = "var main = " + window.Mobify.mainExecutable + "; main();";
        mainScript.id = 'main-executable';
        mainScript.setAttribute("class", "mobify");
    }
    else {
        mainScript = doc.getElementById("main-executable");
    }
    return mainScript;
}

/**
 * Insert Mobify scripts back into the captured doc
 * in order for the library to work post-document.write
 */
Capture.insertMobifyScripts = function(sourceDoc, destDoc) {
    // After document.open(), all objects will be removed.
    // To provide our library functionality afterwards, we
    // must re-inject the script.
    var mobifyjsScript = Capture.getMobifyLibrary(sourceDoc);

    var head = destDoc.head;
    // If main script exists, re-inject it.
    var mainScript = Capture.getMain(sourceDoc);
    if (mainScript) {
        // Since you can't move nodes from one document to another,
        // we must clone it first using importNode:
        // https://developer.mozilla.org/en-US/docs/DOM/document.importNode
        var mainClone = destDoc.importNode(mainScript, false);
        if (!mainScript.src) {
            mainClone.innerHTML = mainScript.innerHTML;
        }
        head.insertBefore(mainClone, head.firstChild)
    }
    // reinject mobify.js file
    var mobifyjsClone = destDoc.importNode(mobifyjsScript, false);
    head.insertBefore(mobifyjsClone, head.firstChild);
};

/**
 * Render the captured document
 */
Capture.prototype.renderCapturedDoc = function(options) {
    // Insert the mobify scripts back into the captured doc
    Capture.insertMobifyScripts(this.sourceDoc, this.capturedDoc);

    // Inject timing point (because of blowing away objects on document.write)
    // if it exists
    if (window.Mobify && window.Mobify.points) {
        var body = this.bodyEl;
        var date = this.capturedDoc.createElement("div");
        date.id = "mobify-point";
        date.setAttribute("style", "display: none;")
        date.innerHTML = window.Mobify.points[0];
        body.insertBefore(date, body.firstChild);
    }

    this.render();
};

return Capture;

});
