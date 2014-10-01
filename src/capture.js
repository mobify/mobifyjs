(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['mobifyjs/utils', 'mobifyjs/patchAnchorLinks'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('../bower_components/mobifyjs-utils/utils.js'), require('./patchAnchorLinks.js'));
    } else {
        // Browser globals (root is window)
        root.Capture = factory(root.Utils, root.patchAnchorLinks);
    }
}(this, function (Utils, patchAnchorLinks) {

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
        var capturedStringFragments = Capture.createDocumentFragmentsStrings(capture.sourceDoc);
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
        
        var create = function() {
            if (!created) {
                created = true;
                iid && clearInterval(iid);
                createCapture(callback, doc, prefix);
            }
        }
        // backup with polling incase readystatechange doesn't fire
        // (happens with some Android 2.3 browsers)
        var iid = setInterval(function(){
            if (Utils.domIsReady(doc)) {
                create();
            }
        }, 100);
        doc.addEventListener("readystatechange", create, false);

    }
};

/**
 * Removes closing tags from the end of an HTML string.
 */
Capture.removeClosingTagsAtEndOfString = function(html) {
    var match = html.match(/((<\/[^>]+>)+)$/);
    if (!match) return html;
    return html.substring(0, html.length - match[0].length);
}

Capture.removeTargetSelf = function(html) {
    return html.replace(/target=("_self"|\'_self\')/gi, '');
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
 * Set the content of an element with html from a string
 */
Capture.setElementContentFromString = function(el, htmlString) {
    for (cachedDiv.innerHTML = htmlString; cachedDiv.firstChild; el.appendChild(cachedDiv.firstChild));
};

/**
 * Returns an object containing the state of the original page. Caches the object
 * in `extractedHTML` for later use.
 */
 Capture.createDocumentFragmentsStrings = function(doc) {
    var headEl = doc.getElementsByTagName('head')[0] || doc.createElement('head');
    var bodyEl = doc.getElementsByTagName('body')[0] || doc.createElement('body');
    var htmlEl = doc.getElementsByTagName('html')[0];

    var captured = {
        doctype: Utils.getDoctype(doc),
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
        return this.doctype + this.htmlOpenTag + this.headOpenTag + (inject || '') + this.headContent + this.bodyOpenTag + this.bodyContent;
    };

    // During capturing, we will usually end up hiding our </head>/<body ... > boundary
    // within <plaintext> capturing element. To construct source DOM, we need to rejoin
    // head and body content, iterate through it to find head/body boundary and expose
    // opening <body ... > tag as a string.

    // Consume comments without grouping to avoid catching
    // <body> inside a comment, common with IE conditional comments.
    // (using a "new RegExp" here because in Android 2.3 when you use a global
    // match using a RegExp literal, the state is incorrectly cached).
    var bodySnatcher = new RegExp('<!--(?:[\\s\\S]*?)-->|(<\\/head\\s*>|<body[\\s\\S]*$)', 'gi');

    //Fallback for absence of </head> and <body>
    var rawHTML = captured.bodyContent = captured.headContent + captured.bodyContent;
    captured.headContent = '';

    // Search rawHTML for the head/body split.
    for (var match; match = bodySnatcher.exec(rawHTML); match) {
        // <!-- comment --> . Skip it.
        if (!match[1]) continue;

        // Grab the contents of head
        captured.headContent = rawHTML.slice(0, match.index);
        // Parse the head content
        var parsedHeadTag = (new RegExp('^[\\s\\S]*(<head(?:[^>\'"]*|\'[^\']*?\'|"[^"]*?")*>)([\\s\\S]*)$')).exec(captured.headContent);
        if (parsedHeadTag) {
            // if headContent contains an open head, then we know the tag was placed
            // outside of the body
            captured.headOpenTag = parsedHeadTag[1];
            captured.headContent = parsedHeadTag[2];
        }

        // If there is a closing head tag
        if (match[1][1] == '/') {
            // Hit </head. Gather <head> innerHTML. Also, take trailing content,
            // just in case <body ... > is missing or malformed
            captured.bodyContent = rawHTML.slice(match.index + match[1].length);
        } else {
            // Hit <body. Gather <body> innerHTML.
            // If we were missing a </head> before, now we can pick up everything before <body
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

Capture.isIOS8_0 = function() {
    var IOS8_REGEX = /ip(hone|od|ad).*Version\/8.0/i;

    return IOS8_REGEX.test(window.navigator.userAgent);
};

/**
 * This is a feature detection function to determine if you
 * can construct body using innerHTML. In iOS8, setting
 * innerHTML on body seems to break if you have forms.
 * If you have forms in the page which are siblings,
 * the second sibling ends up becoming a child element
 * of the first sibling.
 */
Capture.isSetBodyInnerHTMLBroken = function(){
    var doc = document.implementation.createHTMLDocument("");
    var bodyEl = doc.documentElement.lastChild;
    if (!bodyEl) {
        return false;
    }
    bodyEl.innerHTML = '<form></form><form></form>';
    if (bodyEl.childNodes && bodyEl.childNodes.length === 1) {
        return true;
    }
    return false;
};

/**
 * iOS 8.0 has a bug where dynamically switching the viewport (by swapping the
 * viewport meta tag) causes the viewport to automatically scroll. When
 * capturing, the initial document never has an active meta viewport tag.
 * Then, the rendered document injects one causing the aforementioned scroll.
 *
 * Create a meta viewport tag that we inject into the page to force the page to
 * scroll before anything is rendered in the page (this code should be called
 * before document.open!)
 *
 * JIRA: https://mobify.atlassian.net/browse/GOLD-883
 * Open Radar: http://www.openradar.me/radar?id=5516452639539200
 * WebKit Bugzilla: https://bugs.webkit.org/show_bug.cgi?id=136904
 */
Capture.ios8_0ScrollFix = function(doc, callback) {
    // Using `getElementsByTagName` here because grabbing head using
    // `document.head` will throw exceptions in some older browsers (iOS 4.3).
    var head = doc.getElementsByTagName('head');
    // Be extra safe and guard against `head` not existing.
    if (!head.length) {
        return;
    }
    var head = head[0];

    var meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    meta.setAttribute('content', 'width=device-width');
    head.appendChild(meta);

    if (callback) {
        // Wait two paints for the meta viewport tag to take effect. This is
        // required for this fix to work, but guard against it being undefined
        // anyway just in case.
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(function() {
                window.requestAnimationFrame(callback);
            });
        }
        else {
            callback();
        }
    }
};

/**
 * Grab the captured document and render it
 */
Capture.prototype.restore = function(inject) {
    var self = this;

    Utils.waitForReady(document, function() {
        self.render(self.all(inject));
    });
};

/**
 * Grab fragment strings and construct DOM fragments
 * returns htmlEl, headEl, bodyEl, doc
 */
Capture.prototype.createDocumentFragments = function() {
    var docFrags = {};
    var doc = docFrags.capturedDoc = document.implementation.createHTMLDocument("");
    var htmlEl = docFrags.htmlEl = doc.documentElement;
    var headEl = docFrags.headEl = htmlEl.firstChild;
    var bodyEl = docFrags.bodyEl = htmlEl.lastChild;

    // Reconstruct html, body, and head with the same attributes as the original document
    Capture.cloneAttributes(this.htmlOpenTag, htmlEl);
    Capture.cloneAttributes(this.headOpenTag, headEl);
    Capture.cloneAttributes(this.bodyOpenTag, bodyEl);

    var disabledBodyContent = Capture.disable(this.bodyContent, this.prefix);
    // Set innerHTML on body (if the browser is capable of doing so).
    // If not, set innerHTML on a div and copy children elements into body.
    if (!Capture.isSetBodyInnerHTMLBroken()) {
        // Set innerHTML of new source DOM body
        bodyEl.innerHTML = disabledBodyContent;
    } else {
        Capture.setElementContentFromString(bodyEl, disabledBodyContent);
    }

    // In Safari 4/5 and iOS 4.3, there are certain scenarios where elements
    // in the body (ex "meta" in "noscripts" tags) get moved into the head,
    // which can cause issues with certain websites (for example, if you have
    // a meta refresh tag inside of a noscript tag)
    var heads = doc.querySelectorAll('head');
    if (heads.length > 1) {
        while (heads[1].hasChildNodes()) {
            heads[1].removeChild(heads[1].lastChild);
        }
    }

    var disabledHeadContent = Capture.disable(this.headContent, this.prefix);
    // On FF4, iOS 4.3, and potentially other browsers, you cannot modify <head>
    // using innerHTML. In that case, do a manual copy of each element
    try {
        headEl.innerHTML = disabledHeadContent;
    } catch (e) {
        var title = headEl.getElementsByTagName('title')[0];
        title && headEl.removeChild(title);
        Capture.setElementContentFromString(headEl, disabledHeadContent);
    }

    return docFrags;
};

/**
 * Returns an HTML representation of the captured DOM with resources enabled.
 * (escapedHTMLString remains for backwards compatibility)
 */
Capture.prototype.enabledHTMLString = Capture.prototype.escapedHTMLString = function() {
    var doc = this.capturedDoc;
    var html = Capture.enable(Utils.outerHTML(doc.documentElement), this.prefix);
    var htmlWithDoctype = this.doctype + html;
    return htmlWithDoctype;
};

/**
 * Rewrite the document with a new html string
 */
Capture.prototype.render = function(htmlString) {
    var enabledHTMLString;
    if (!htmlString) {
        enabledHTMLString = this.enabledHTMLString();
    } else {
        enabledHTMLString = Capture.enable(htmlString, this.prefix);
    }

    var doc = this.sourceDoc;

    // Set capturing state to false so that the user main code knows how to execute
    if (window.Mobify) window.Mobify.capturing = false;

    var write = function() {
        // Asynchronously render the new document
        setTimeout(function(){
            doc.open("text/html", "replace");
            doc.write(enabledHTMLString);
            doc.close();
        });
    };
    
    if (Capture.isIOS8_0()) {
        Capture.ios8_0ScrollFix(document, write);
    } else {
        write();
    }
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

/**
 * Grabs the postload function/src/script if it exists
 */
Capture.getPostload = function(doc) {
    var doc = doc || document;
    var postloadScript = undefined;

    // mainExecutable is used for backwards compatibility purposes
    var tagOptions = window.Mobify.Tag && window.Mobify.Tag.options && window.Mobify.Tag.getOptions(Mobify.Tag.options) || {};
    var postload = (tagOptions.post && tagOptions.post.toString()) || window.Mobify.mainExecutable;
    if (postload) {
        // Checks for main executable string on Mobify object and creates a script
        // out of it
        postloadScript = document.createElement('script');
        postloadScript.innerHTML = "var postload = " + postload + "; postload();";
        postloadScript.id = 'postload';
        postloadScript.setAttribute("class", "mobify");
    } else {
        // Older tags used to insert the main executable by themselves. 
        postloadScript = doc.getElementById("main-executable");
    }
    return postloadScript;
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

    var head = destDoc.head || destDoc.getElementsByTagName('head')[0];
    if (!head) {
        return;
    }

    // If main script exists, re-inject it.
    var mainScript = Capture.getPostload(sourceDoc);
    if (mainScript) {
        // Since you can't move nodes from one document to another,
        // we must clone it first using importNode:
        // https://developer.mozilla.org/en-US/docs/DOM/document.importNode
        var mainClone = destDoc.importNode(mainScript, false);
        if (!mainScript.src) {
            mainClone.innerHTML = mainScript.innerHTML;
        }
        head.insertBefore(mainClone, head.firstChild);
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

/**
 * patchAnchorLinks
 *
 * Anchor Links `<a href="#foo">Link</a>` are broken on Firefox.
 * We provide a function that patches, but it does break
 * actually changing the URL to show "#foo".
 * 
 */
Capture.patchAnchorLinks = patchAnchorLinks;

return Capture;

}));
