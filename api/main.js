/*
Processing order description

Before this script runs:

0. Escaping
The Mobify tags identities whether a browser transform the page.
If so, tag escapes the document contents, allowing markup to be captured 
without loading external resources.


This script does:

1. Source DOM Construction - extractDOM()

The escaped markup is retrieved from the DOM as a string. The escaped markup is 
transformed into a DOM node after resource loading attributes are escaped.

2. Data processing - run konf function, which invokes acceptHTML() callback

A data object is created by selecting elements from source DOM or whatever
other means necessary. Sometime during this process, output HTML would be build, 
through dust templating, DOM construction + outerHTML or some other way.
This HTML string is fed into acceptHTML() callback

3. Document replacement - writeHTML()

The current document is abandoned, and retrieved content is inejcted into a new one
via document.open/write/close. This makes the browser behave almost as if the 
replacement HTML was originally sent down the pipe.

*/
(function(document, $, Mobify) {

var timing = Mobify.timing
  , transform = Mobify.transform = Mobify.transform || {};

$.extend(Mobify.transform, {
    // Read the conf, extract the Source DOM and begin the evaluation.
    prepareConf : function(rawConf) {
        var capturedState = Mobify.html.extractDOM();
        capturedState.config = Mobify.config;
        try {
            var base = Mobify.mobject.M(capturedState, transform.acceptHTML);
            rawConf.call(base, capturedState, transform.acceptHTML);
        } catch (e) {
            transform.acceptHTML(e)
        }
    },

    // `acceptHTML` is exposed on `Mobify` so it can be overridden for server-side adaptation.
    // Called when the `konf` has been evaluated.
    acceptHTML: function(markup) {
        if (markup instanceof Error) markup = markup.payload;
        markup = markup || "";

        if (typeof Mobify.html.acceptedHTML == "string") return;
        Mobify.html.acceptedHTML = markup;
        timing.addPoint('Adapted passive document');
        
        markup = Mobify.html.enable(markup);
        timing.addPoint('Re-enabled external resources');

        if (Mobify.config.isDebug) {
            timing.logPoints();
            Mobify.mobject.log();
        }
        Mobify.html.writeHTML(markup);
    },

    // Kickstart processing. Guard against beginning before the document is ready.
    run: function(conf) {
        Mobify.timing.addPoint('Started adaptation');
        var prepareConf = function() {
            // Do NOT proceed unless we're ready.
            if (!/complete|loaded/.test(document.readyState)) {
                return setTimeout(prepareConf, 15);
            }
            Mobify.transform.prepareConf(conf);
        };

        prepareConf();
    }
});

})(document, Mobify.$, Mobify);
