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
                // Disregard subsequent closing </head> tags.
                if (captured.headContent) continue;

                // Hit </head. Gather <head> innerHTML. Also, take trailing content,
                // just in case <body ... > is missing or malformed
                captured.headContent = rawHTML.slice(0, match.index);
                captured.bodyContent = rawHTML.slice(match.index + match[1].length);
            } else {
                // Hit <body. Gather <body> innerHTML.

                // If we were missing a </head> before, now we can pick up everything before <body
                captured.headContent = captured.headContent || rawHTML.slice(0, match.index);
                captured.bodyContent = match[0];

                // Find the end of <body ... >
                var parseBodyContent = /^((?:[^>'"]*|'[^']*?'|"[^"]*?")*>)([\s\S]*)$/.exec(captured.bodyContent);
                
                // Will skip this if <body was malformed (e.g. no closing > )
                if (parseBodyContent) {
                    // Normal termination. Both </head> and <body> were recognized and split out
                    captured.bodyTag = parseBodyContent[1];
                    captured.bodyContent = parseBodyContent[2];
                }
                break;
            }
        }
        return captured;
    }

    // Transform a primitive <tag attr="value" ...> into corresponding DOM element
    // Unlike $('<tag>'), correctly handles <head>, <body> and <html>
  , cloneAttrs = function(source, dest) {
        var match = source.match(/^<(\w+)([\s\S]*)$/i);

        $.each($('<div' + match[2])[0].attributes, function(i, attr) {
            dest.setAttribute(attr.nodeName, attr.nodeValue);
        });

        return dest;
    };

// 1. Get the original markup from the document.
// 2. Disable the markup.
// 3. Construct the source pseudoDOM.    
Mobify.html.extractDOM = function() {
    // Extract escaped markup out of the DOM
    var captured = guillotine(Mobify.html.extractHTML());
    
    Mobify.timing.addPoint('Extracted source HTML');
    
    // Disable attributes that can cause loading of external resources
    var disabledHead = Mobify.html.disable(captured.headContent)
      , disabledBody = Mobify.html.disable(captured.bodyContent)
      , document = window.document.implementation.createHTMLDocument()
      , htmlEl = document.documentElement
      , headEl = htmlEl.firstChild
      , bodyEl = htmlEl.lastChild
      , div = document.createElement('div');
    
    Mobify.timing.addPoint('Disabled external resources');

    var result = {
        'doctype' : captured.doctype
      , 'document' : document
      , '$head' : $(cloneAttrs(captured.headTag, headEl))
      , '$body' : $(cloneAttrs(captured.bodyTag, bodyEl))
      , '$html' : $(cloneAttrs(captured.htmlTag, htmlEl))
    };

    bodyEl.innerHTML = disabledBody;

    var title = headEl.getElementsByTagName('title')[0];
    title && headEl.removeChild(title);
    for (div.innerHTML = disabledHead; div.firstChild; headEl.appendChild(div.firstChild));

    Mobify.timing.addPoint('Created passive document');
    
    return result;
};

})(Mobify.$, Mobify);