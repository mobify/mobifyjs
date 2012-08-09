(function(Mobify) {

var $ = Mobify.$
  , timing = Mobify.timing

    /**
     * Returns a captured HTML object suitable for DOMification.
     *
     * <plaintext> escaping pushes captured <head> content into the <body>, so
     * the </head><body> boundary will be in `extractedHTML.bodyContent`.
     *
     * To construct the source DOM, we must fix `headContent` and `bodyContent`
     * by finding the boundary and redistributing the content.
     */
  , guillotine = function(captured) {
        captured = $.extend({}, captured);

        // Eat comments without grouping to avoid catching <body> inside 
        // conditional comments.
        var bodySnatcher = /<!--(?:[\s\S]*?)-->|(<\/head\s*>|<body[\s\S]*$)/gi
            // Fallback for absence of </head> and <body>
          , rawHTML = captured.bodyContent = captured.headContent + captured.bodyContent;

        captured.headContent = '';

        // Search rawHTML for the </head><body> split.
        for (var match; match = bodySnatcher.exec(rawHTML); match) {
            // Skip comments.
            if (!match[1]) continue;

            // Hit "</head". Gather <head> content by tracking back. Gather the
            // <body> by tracking forward.
            if (match[1][1] == '/') {
                captured.headContent = rawHTML.slice(0, match.index);
                captured.bodyContent = rawHTML.slice(match.index + match[1].length);
            // Hit "<body". Gather <body> content. 
            } else {
                // If we haven't encoutered "</head" then we can assume
                // everything before this is the head. Everything after is the
                // body!
                captured.headContent = captured.head || rawHTML.slice(0, match.index);
                captured.bodyContent = match[0];

                // Find the end of <body ... >
                var parseBodyTag = /^((?:[^>'"]*|'[^']*?'|"[^"]*?")*>)([\s\S]*)$/.exec(match[0]);
                
                if (parseBodyTag) {
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

  , html = Mobify.html || {};

$.extend(html, {

    /**
     * Returns the disabled source DOM.
     */
    extractDOM: function() {
        // Extract the escaped markup from the DOM.
        var captured = guillotine(html.extractHTML());
        
        timing.addPoint('Recovered Markup');
        
        // Disable attributes that cause resource loading.
        var disabledHead = this.disable(captured.headContent)
          , disabledBody = this.disable(captured.bodyContent);
        
        timing.addPoint('Disabled Markup');

        // DOMify HTML strings.
        var div = document.createElement('div')
          , headEl = makeElement(captured.headTag)
          , bodyEl = makeElement(captured.bodyTag)
          , htmlEl = makeElement(captured.htmlTag)
          , result = {
                'doctype' : captured.doctype
              , '$head' : $(headEl)
              , '$body' : $(bodyEl)
              , '$html' : $(htmlEl)
            };

        for (div.innerHTML = disabledHead; div.firstChild; headEl.appendChild(div.firstChild));
        for (div.innerHTML = disabledBody; div.firstChild; bodyEl.appendChild(div.firstChild));

        htmlEl.appendChild(headEl);
        htmlEl.appendChild(bodyEl);
                
        timing.addPoint('Built Passive DOM');
        
        return result;
    }
});

})(Mobify);