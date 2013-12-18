window.Assert = (function() {
    var sendMessage = function(method, args) {
        parent.postMessage({
            "assert": true,
            "method": method,
            "args": [].slice.apply(args)
        }, "*");
    };

    var exports = {};

    var ready = false;
    exports.ready = function() {
        if (!ready) {
            parent.postMessage("ready", "*");
            ready = true;
        }
    }

    var methods = [
        'deepEqual',
        'equal',
        'notDeepEqual',
        'notEqual',
        'notStrictEqual',
        'ok',
        'strictEqual'
    ]

    for (var i=0, _len=methods.length; i<_len; i++) {
        var method = methods[i];

        exports[method] = (function(method) {
            return function() {
                exports.ready();
                sendMessage(method, arguments);
            };
        })(method);
    }

    return exports;
})();