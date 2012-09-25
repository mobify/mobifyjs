define(["../mObject.utils", "../transform", "./adaptDOM"], function(bindM, transform, adaptDOM) {
	return transform.adapt = function(adaptFn, callback, $) {
        transform.adaptDOM(function(source, callback) {            
            var M = bindM(source, callback);
            M.$ = this.$;
            adaptFn.call(M, source, callback);
        });
    }
});