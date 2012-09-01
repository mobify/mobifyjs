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
(function(Mobify) {

var timing = Mobify.timing;
var transform = Mobify.transform = {
    prepareSource : function() {
        var capturedState = Mobify.html.extract();
        Mobify.timing.addPoint('Extracted source HTML');

        capturedState.config = Mobify.config;
        return capturedState;
    }
  , stringifyResult: function(obj) {
        obj = obj || "";

        if (obj.outerHTML) obj = obj.outerHTML;
        if (obj.appendTo) obj = obj.map(function(el) { return el.outerHTML || "" }).join("");
        if (obj.document) obj = obj.document;
        if (obj.nodeType === Node.DOCUMENT_NODE) {
            obj = Mobify.html.doctype(doc) + obj.document.documentElement.outerHTML;
        }

        return obj;
    }
  , writeResult: function(markup) {
        markup = markup || "";
        Mobify.html.memo.accepted = markup;
        timing.addPoint('Adapted passive document');
            
        Mobify.html.writeHTML(markup);
    }
  , setup: function(fn, source, callback) {
        var called = false;
        var callbackOnce = function(result) {
            if (called) return;
            called = true;

            if (result instanceof Error) result = result.payload;
            callback(result);
        }

        try {
            Mobify.timing.addPoint('Starting processing');
            fn.call(this, source, callbackOnce);
        } catch (e) {
            callbackOnce(e);
        }
    }
  , adaptHTML: function(adaptFn) {
        var runWhenReady = function() {
            if (!/complete|loaded/.test(document.readyState)) {
                return setTimeout(runWhenReady, 15);
            }
            timing.addPoint('Document ready for extraction');
            transform.setup(adaptFn, transform.prepareSource(), transform.writeResult);
        };

        timing.addPoint('Started adaptation');
        runWhenReady();
    }
  , adaptDOM: function(adaptFn) {
        this.adaptHTML(function(source, callback) {
            var disabledSource = Mobify.html.disable(source);
            Mobify.timing.addPoint('Disabled external resources');

            var dom = Mobify.html.extractDOM(disabledSource);
            Mobify.timing.addPoint('Created passive document');

            adaptFn.call(this, dom, function(result) {
                var flattenedResult = Mobify.transform.stringifyResult(result);
                var enabledResult = Mobify.html.enable(flattenedResult);
                return callback(enabledResult);
            });
        });
    }
  , adapt: function(adaptFn) {
        this.adaptDOM(function(source, callback) {            
            var M = Mobify.MObject.bindM(source, callback);
            adaptFn.call(M, source, callback);
        });
    }
};

})(Mobify);