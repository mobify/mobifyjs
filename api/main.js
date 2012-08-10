/*

Processing order description

1. Escaping

The Mobify tags identities whether a browser should recieve the transformation.
If so, it escapes the document, allowing for markup capture without loading
external resources.

2. Source DOM Construction

The escaped markup is retrieved from the DOM as a string. The escaped markup is 
transformed into a DOM node after resource loading attributes are escaped.

3. Data select

A data object is created by select nodes from the source DOM using DOM methods.

4. Markup generation.

A dust template is rendered with the data as a context, producing the final HTML.

5. Document replacement

The current document is replaced by using document.open/write/close. This makes 
the browser behave as if the templated HTML was the regular source.

*/
(function(document, Mobify) {

var $ = Mobify.$
  , timing = Mobify.timing
  , transform = Mobify.transform = Mobify.transform || {}
  , html = Mobify.html
  , config = Mobify.config

$.extend(transform, {
    /**
     * Read the conf, extract the Source DOM and begin the evaluation.
     */
    prepareConf: function(rawConf) {
        var capturedState = html.extractDOM();
        capturedState.config = config;
        // If conf is using data2 evaluation in a {+conf} or {+konf}, this call would provide
        // an interpretable source data object. 
        // If conf is using just a function(), the return value is not useful,
        // as result HTML would be provided as sole argument of a callback.
        var conf = Mobify.conf = rawConf.call(
                Mobify.data2 && Mobify.data2.M(),
                capturedState,
                // This is escape path for function-based confs
                transform.acceptData);

        // And this is the normal data evaluation
        if (conf && conf.data) {
            timing.addPoint('Setup Conf');

            conf.data = $.extend(capturedState, conf.data);

            Mobify.evaluatedData = undefined;

            var cont = Mobify.data2.makeCont({source: capturedState})
                        .on('complete', transform.acceptData);

            timing.addPoint('Prepared conf for evaluation');
            timing.addSelector('Start');
            cont.eval();
        }
    }

    /**
     * Called after the `konf` has been evaluated.
     */
  , acceptData: function(data, cont) {     
        if (!Mobify.evaluatedData) {
            Mobify.evaluatedData = data;
            Mobify.evaluatedCont = cont;
            timing.addPoint('Evaluated Conf');
        }
        
        var outputHTML = (typeof data == "string") ? data : data.OUTPUTHTML
          , enabled = html.enable(outputHTML || '');

        timing.addPoint('Enabled Markup');
        transform.emitMarkup(enabled);
    }

    /**
     * Write `markup` out to the document.
     */
  , emitMarkup: function(markup) {
        timing.addPoint('DOMContentLoaded');

        if (!markup) {
            Mobify.console.warn('Output HTML is empty, unmobifying.');
            return Mobify.unmobify();
        }

        timing.addPoint('Writing Document');

        if (config.isDebug) {
            timing.logPoints();
        }

        // We'll write markup a tick later, as Firefox logging is async
        // and gets interrupted if followed by synchronous document.open
        setTimeout(function() {
            // `document.open` clears events bound to `document`.
            document.open();
            // In Webkit, `document.write` immediately executes inline scripts 
            // not preceded by an external resource.
            document.write(markup);
            document.close();
        });
    }

    /**
     * Begin the adaptation.
     */
  , run: function(conf) {
        var prepareConf = function() {
                // Do not pass go until ready.
                if (!/complete|loaded/.test(document.readyState)) {
                    return setTimeout(prepareConf, 15);
                }
                transform.prepareConf(conf);
            };

        prepareConf();
    }
});

timing.addPoint('Walked Mobify.js');

})(document, Mobify);