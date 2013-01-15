define("capture", ["Zepto"], function($) {

    // Returns an array of keys from an object
var keys = function(obj) {
        return $.map(obj, function(val, key) {
            return key 
        }) 
    }
    // Returns an array of keys from an object
  , values = function(obj) { 
        return $.map(obj, function(val, key) { 
            return val 
        }) 
    }

  , openingScriptRe = new RegExp('(<script[\\s\\S]*?>)', 'gi')

    // Inline styles are scripts are disabled using a unkonwn type.
  , tagDisablers = {
        style: ' media="mobify-media"'
      , script: ' type="text/mobify-script"'
    }
  , tagEnablingRe = new RegExp(values(tagDisablers).join('|'), 'g')
  // sj: Make this configurable?
  , disablingMap = { 
        img:    ['src', 'height', 'width']
      , iframe: ['src']
      , script: ['src', 'type']
      , link:   ['href']
      , style:  ['media']
    }
  , affectedTagRe = new RegExp('<(' + keys(disablingMap).join('|') + ')([\\s\\S]*?)>', 'gi')
  , attributeDisablingRes = {}
  , attributesToEnable = {}
  , attributeEnablingRe

// Populate `attributesToEnable` and `attributesToEnable`.
$.each(disablingMap, function(tagName, targetAttributes) {
    $.each(targetAttributes, function(key, value) {
        attributesToEnable[value] = true;
    });

    // Special treatment for images - disable existing width/height attributes.
    if (tagName === 'img') {
        targetAttributes = targetAttributes.concat('width', 'height')
    }

    // <space><attr>='...'|"..."
    attributeDisablingRes[tagName] = new RegExp(
        '\\s+((?:'
        + targetAttributes.join('|')
        + ")\\s*=\\s*(?:'([\\s\\S])+?'|\"([\\s\\S])+?\"))", 'gi');
})

// sj: WHY do we need to generate a regexp object here? 
//     Hmmm probably makes it easier to add new tags/attributes in the future...
attributeEnablingRe = new RegExp('\\sx-(' + keys(attributesToEnable).join('|') + ')', 'gi');

function disableAttributes(whole, tagName, tail) {
    tagName = tagName.toLowerCase();
    return result = '<' + tagName + (tagDisablers[tagName] || '')
        + tail.replace(attributeDisablingRes[tagName], ' x-$1') + '>';
}

/**
 * Returns a string with all external attributes disabled.
 * Includes special handling for resources referenced in scripts and inside
 * comments.
 */
function disable(htmlStr) {            
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
function enable(htmlStr) {
    return htmlStr.replace(attributeEnablingRe, ' $1').replace(tagEnablingRe, '');
}

// extractHTML

var nodeName = function(node) {
        return node.nodeName.toLowerCase();
    }

  , escapeQuote = function(s) {
        return s.replace('"', '&quot;');
    }

    /**
     * Return a string for the opening tag of DOMElement `element`.
     */
  , openTag = function(element) {
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
  , closeTag = function(element) {
        if (!element) return '';
        if (element.length) element = element[0];

        return '</' + nodeName(element) + '>';
    }

    /**
     * Return a string for the doctype of the current document.
     */
  , doctype = function(doc) {
        var doctypeEl = doc.doctype || [].filter.call(doc.childNodes, function(el) {
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
  , extractHTMLFromElement = function(container) {
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
  , extractedHTML

    /**
     * Returns an object containing the state of the original page. Caches the object
     * in `extractedHTML` for later use.
     */
  , extractHTML = function(doc) {
        if (extractedHTML) return extractedHTML;

        var doc = doc || document
          , headEl = doc.getElementsByTagName('head')[0] || doc.createElement('head')
          , bodyEl = doc.getElementsByTagName('body')[0] || doc.createElement('body')
          , htmlEl = doc.getElementsByTagName('html')[0];

        extractedHTML = {
            doctype: doctype(doc),
            htmlTag: openTag(htmlEl),
            headTag: openTag(headEl),
            bodyTag: openTag(bodyEl),
            headContent: extractHTMLFromElement(headEl),
            bodyContent: extractHTMLFromElement(bodyEl)
        };

        /**
         * RR: I assume that Mobify escaping tag is placed in <head>. If so, the <plaintext>
         * it emits would capture the </head><body> boundary, as well as closing </body></html>
         * Therefore, bodyContent will have these tags, and they do not need to be added to .all()
         */
        extractedHTML.all = function(inject) {
            return this.doctype + this.htmlTag + this.headTag + (inject || '') + this.headContent + this.bodyContent;
        }

        return extractedHTML;
    }

  , unmobify = function(doc) {
        doc = doc || document
        if (/complete|loaded/.test(doc.readyState)) {
            unmobifier(doc);
        } else {
            doc.addEventListener('DOMContentLoaded', unmobifier, false);
        }
    }

    /** 
     * Gather escaped content from the DOM, unescaped it, and then use 
     * `document.write` to revert to the original page.
     */
  , unmobifier = function(doc) {
        doc = (doc && doc.target || doc) || document
        doc.removeEventListener('DOMContentLoaded', unmobifier, false);
        var captured = extractHTML(doc);

        // Wait up for IE, which may not be ready to.
        setTimeout(function() {
            // TODO: deal with ajs

            doc.open();
            doc.write(captured.all(inject));
            doc.close();
        }, 15);
    }

// extractDOM

// During capturing, we will usually end up hiding our </head>/<body ... > boundary
// within <plaintext> capturing element. To construct shadow DOM, we need to rejoin
// head and body content, iterate through it to find head/body boundary and expose
// opening <body ... > tag as a string.
var guillotine = function(captured) {
        // Consume comments without grouping to avoid catching
        // <body> inside a comment, common with IE conditional comments.
        var bodySnatcher = /<!--(?:[\s\S]*?)-->|(<\/head\s*>|<body[\s\S]*$)/gi;

        captured = $.extend({}, captured);
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
                var parseBodyTag = /^((?:[^>'"]*|'[^']*?'|"[^"]*?")*>)([\s\S]*)$/.exec(match[0]);
                
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

    // Transform a primitive <tag attr="value" ...> into corresponding DOM element
    // Unlike $('<tag>'), correctly handles <head>, <body> and <html>
  , makeElement = function(html) {
        var match = html.match(/^<(\w+)([\s\S]*)/i);
        var el = document.createElement(match[1]);

        $.each($('<div' + match[2])[0].attributes, function(i, attr) {
            el.setAttribute(attr.nodeName, attr.nodeValue);
        });

        return el;
    }

    // 1. Get the original markup from the document.
    // 2. Disable the markup.
    // 3. Construct the source pseudoDOM.    
  , extractDOM = function() {
        // Extract escaped markup out of the DOM
        var captured = guillotine(extractHTML());
            
        // Disable attributes that can cause loading of external resources
        var disabledHead = disable(captured.headContent)
          , disabledBody = disable(captured.bodyContent);
        
        // Reinflate HTML strings back into declawed DOM nodes.
        var div = document.createElement('div');
        var headEl = makeElement(captured.headTag);
        var bodyEl = makeElement(captured.bodyTag);
        var htmlEl = makeElement(captured.htmlTag);
        var result = {
            'doctype' : captured.doctype
          , '$html' : $(htmlEl)
        };

        for (div.innerHTML = disabledHead; div.firstChild; headEl.appendChild(div.firstChild));
        for (div.innerHTML = disabledBody; div.firstChild; bodyEl.appendChild(div.firstChild));
        htmlEl.appendChild(headEl);
        htmlEl.appendChild(bodyEl);
                    
        return result;
    };

// Public Methods
var Capture = {}

  , getSourceDOM = Capture.getSourceDOM = function() {
        if (!Capture.capturedDOM) {
            var capturedDOM = Capture.capturedDOM = extractDOM()['$html'];
        }
        return Capture.capturedDOM;
    }

    // sj: should these methods be bound to the Zepto object itself?
  , unescapedHtmlString = Capture.unescapedHtmlString = function() {
        return getSourceDOM()[0].outerHTML;
    }
  , escapedHtmlString = Capture.escapedHtmlString =  function() {
        return enable(unescapedHtmlString());
    }
  , render = Capture.render = function(htmlString) {
        // Cleanup. 
        // Objects are blown away on FF after doc.write, but not in Chrome, so we delete them
        // explicitly to maintain consistency. To get around this, we re-inject the mobify.js libray below
        
        window.setTimeout(function(){
            document.open();
            document.write(htmlString);
            document.close();
        });
  }

  , renderSourceDOM = Capture.renderSourceDOM = function(options) {

        // Re-add this script back into the DOM to be re-executed post processing
        // aka new Ark :)
        var injectScript = "<script id=\"mobifyjs\" type=\"text/javascript\">" + window.library + "</scr" + "ipt>";
        getSourceDOM().find("body").prepend(injectScript);

        // Remove main, and if it should be reinjected, append it as the last child of body
        var main = getSourceDOM().find("#mobify-js-main");
        if (options.injectMain) {
            getSourceDOM().find("body").append(main);
        }
        main.remove();

        // Set capturing state to false so that the user main code knows how to execute
        capturing = false;

        render(escapedHtmlString());
    };

return Capture;

});
