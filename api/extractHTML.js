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

    // Memoize result of extract
  , extractedHTML

    // Returns an object containing the state of the original page. Caches the object
    // in `extractedHTML` for later use.
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

        extractedHTML.all = function(inject) {
            // RR: I assume that Mobify escaping tag is placed in <head>. If so, the <plaintext>
            // it emits would capture the </head><body> boundary, as well as closing </body></html>
            // Therefore, bodyContent will have these tags, and they do not need to be added to .all()
            return this.doctype + this.htmlTag + this.headTag + (inject || '') + this.headContent + this.bodyContent;
        }

        return extractedHTML;
    }

  , unmobify = Mobify.unmobify = function(doc) {
        doc = doc || document
        if (/complete|loaded/.test(doc.readyState)) {
            unmobifier(doc);
        } else {
            doc.addEventListener('DOMContentLoaded', unmobifier, false);
        }
    }

    // Gather escaped content from the DOM, unescaped it, and then use 
    // `document.write` to revert to the original page.
  , unmobifier = function(doc) {
        //RR: Why all the document-getting plumbing instead of using normal 'document'?
        doc = (doc && doc.target || doc) || document
        doc.removeEventListener('DOMContentLoaded', unmobifier, false);
        var captured = extractHTML(doc);

        // TODO: Confirm this.
        // Wait up for IE, which isn't ready to do this just yet.
        setTimeout(function() {
            var inject = Mobify.ajs && ('<script defer src="' + Mobify.ajs + '"></script>');

            doc.open();
            // RR: Undid extractHTML(doc).all().
            // It would not have worked, as doc is blanked by document.open()
            doc.write(captured.all(inject));
            doc.close();
        }, 15);
    }
    
  , html = Mobify.html || {}

if (Mobify.$) {
    Mobify.$.extend(html, {
        extractHTML: extractHTML
      , extractHTMLFromElement: extractHTMLFromElement
      , openTag: openTag
      , closeTag: closeTag
    });
} else {
    Mobify.api = 1;
    unmobify();
}

})(document, Mobify);
