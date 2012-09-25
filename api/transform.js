define(["./mobifyjs", "./timing", "./iter", "./config", "./extractHTML"], function(Mobify, timing, iter, config, html) {
    return Mobify.transform = {
        prepareSource : function() {
            var capturedState = html.extract();
            timing.addPoint('Extracted source HTML');

            capturedState.config = config;
            return capturedState;
        }
      , writeResult: function(markup) {
            markup = markup || "";
            html.memo.accepted = markup;
            timing.addPoint('Adapted passive document');
                
            html.writeHTML(markup);
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
                timing.addPoint('Starting processing');
                fn.call(this, source, callbackOnce);
            } catch (e) {
                callbackOnce(e);
            }
        }
    };
});