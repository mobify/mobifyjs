// provides extractDOM
(function($, Mobify) {

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

        return $(el);
    }

  , html = Mobify.html || {};

$.extend(html, {

    // 1. Get the original markup from the document.
    // 2. Disable the markup.
    // 3. Construct the source pseudoDOM.    
    extractDOM: function() {
        // Extract escaped markup out of the DOM
        var captured = guillotine(html.extractHTML());
        
        Mobify.timing.addPoint('Extracted source HTML');
        
        // Disable attributes that can cause loading of external resources
        var disabledHead = this.disable(captured.headContent)
          , disabledBody = this.disable(captured.bodyContent);
        
        Mobify.timing.addPoint('Disabled external resources');

        // Reinflate HTML strings back into declawed DOM nodes.
        var result = { doctype: captured.doctype };
        result.$head = makeElement(captured.headTag).append(disabledHead);
        result.$body = makeElement(captured.bodyTag).append(disabledBody);
        result.$html = makeElement(captured.htmlTag).append(result.$head, result.$body);
        
        Mobify.timing.addPoint('Created passive document');
        
        return result;
    }
});

})(Mobify.$, Mobify);