define(["../transform", "../timing", "dev!../log.timing"], function(transform, timing) {
    return transform.adaptHTML = function(adaptFn) {
        var runWhenReady = function() {
            if (!/complete|loaded/.test(document.readyState)) {
                return setTimeout(runWhenReady, 15);
            }
            timing.addPoint('Document ready for extraction');
            transform.setup(adaptFn, transform.prepareSource(), function(result) {
                transform.writeResult(result);
                timing.emit();              
            });
        };

        timing.addPoint('Started adaptation');
        runWhenReady();
    };  
}); 