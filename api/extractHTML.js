(function (document, Mobify) {

var nodeName = function(node) {
        return node.nodeName.toLowerCase();
    }

  , escapeQuote = function(s) {
        return s.replace('"', '&quot;');
    }

    // Return a string for the opening tag of DOMElement `element`.
  , openTag = function(element) {
        if (!element) return '';
        if (element.length) element = element[0];

        var stringBuffer = [];

        [].forEach.call(element.attributes, function(attr) {
            stringBuffer.push(' ', attr.name, '="', escapeQuote(attr.value), '"');
        })

        return '<' + nodeName(element) + stringBuffer.join('') + '>';
    }

    // Return a string for the closing tag of DOMElement `element`.
  , closeTag = function(element) {
        if (!element) return '';
        if (element.length) element = element[0];

        return '</' + nodeName(element) + '>';
    }

    // Return a string for the doctype of the current document.
  , doctype = function() {
        var doctypeEl = document.doctype || [].filter.call(document.childNodes, function(el) {
                return el.nodeType == Node.DOCUMENT_TYPE_NODE
            })[0];

        if (!doctypeEl) return '';

        return '<!DOCTYPE HTML'
            + (doctypeEl.publicId ? ' PUBLIC "' + doctypeEl.publicId + '"' : '')
            + (doctypeEl.systemId ? ' "' + doctypeEl.systemId + '"' : '')
            + '>';
    }

    // Returns a string of the unesacped content from a plaintext escaped `container`.
  , extractHTMLFromElement = function(container) {
        if (!container) return '';

        return [].map.call(container.childNodes, function(el) {
            var tagName = nodeName(el);
            if (tagName == '#comment') return '<!--' + el.textContent + '-->'
            if (tagName == 'plaintext') return el.textContent
            if (tagName == 'script' && ((/mobify\./.test(el.src) || /Mobify/.test(el.textContent)))) {
                return '';  
            }
            return el.outerHTML || el.nodeValue;
        }).join('');
    }

    // Returns an object containing the state of the original page. Caches the object
    // in `extractedHTML` for later use.
  , extractHTML = function() {
        if (this.extractedHTML) return this.extractedHTML;

        var headEl = document.getElementsByTagName('head')[0] || document.createElement('head')
          , bodyEl = document.getElementsByTagName('body')[0] || document.createElement('body')
          , htmlEl = document.getElementsByTagName('html')[0];

        var extractedHTML = this.extractedHTML = {
            doctype: doctype(document),
            htmlTag: openTag(htmlEl),
            headTag: openTag(headEl),
            bodyTag: openTag(bodyEl),
            headContent: extractHTMLFromElement(headEl),
            bodyContent: extractHTMLFromElement(bodyEl)
        };

        extractedHTML.all = function() {
            // RR: I assume that Mobify escaping tag is placed in <head>. If so, the <plaintext>
            // it emits would capture the </head><body> boundary, as well as closing </body></html>
            // Therefore, bodyContent will have these tags, and they do not need to be added to .all()
            return this.doctype + this.htmlTag + this.headTag + this.headContent + this.bodyContent;
        }

        return extractedHTML;
    }
  , writeHTML = function(markup) {
        if (!markup) {
            console && console.warn('Output HTML is empty, unmobifying.');
            markup = html.extractHTML().all();
        }
        this.writtenHTML = markup;

        // We'll write markup a tick later, as Firefox logging is async
        // and gets interrupted if followed by synchronous document.open
        window.setTimeout(function(){
            // `document.open` clears events bound to `document`.
            // The special parameters prevent IE from creating a history entry
            document.open("text/html", "replace");

            // In Webkit, `document.write` immediately executes inline scripts 
            // not preceded by an external resource.
            document.write(markup);
            document.close();
        });
    }

  , unmobify = function() {
        if (/complete|loaded/.test(document.readyState)) {
            unmobifier();
        } else {
            document.addEventListener('DOMContentLoaded', unmobifier, false);
        }
    }

    // Gather escaped content from the DOM, unescaped it, and then use 
    // `document.write` to revert to the original page.
  , unmobifier = function() {
        document.removeEventListener('DOMContentLoaded', unmobifier, false);
        html.writeHTML();
    }
    
  , html = Mobify.html || {}

if (Mobify.$) {
    Mobify.$.extend(html, {
        'writeHTML': writeHTML
      , 'unmobify': unmobify
      , 'extractHTML': extractHTML
      , 'extractHTMLFromElement': extractHTMLFromElement
      , 'openTag': openTag
      , 'closeTag': closeTag
    });
} else {
    Mobify.api = 1;
    unmobify();
}

})(document, Mobify);
