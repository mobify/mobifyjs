window.Assert = (function() {
    var sendMessage = function(method, args) {
        var message = {
            "assert": true,
            "method": method,
            "args": [].slice.call(args)
        };

        parent.postMessage("json:" + JSON.stringify(message), "*");
    };

    var exports = {};

    var ready = false;
    var readyHold = 0;
    var callReady = false;

    exports.ready = function() {
        callReady = true;

        if (!ready && readyHold === 0) {
            parent.postMessage("ready", "*");
            ready = true;
        }
    };

    exports.holdReady = function() {
        readyHold++;
    };

    exports.releaseReady = function() {
        readyHold--;

        if (callReady) { exports.ready() };
    };

    var methods = [
        'deepEqual',
        'equal',
        'notDeepEqual',
        'notEqual',
        'notStrictEqual',
        'ok',
        'strictEqual',
        'start'
    ]

    for (var i=0, _len=methods.length; i<_len; i++) {
        var method = methods[i];

        exports[method] = (function(method) {
            return function() {
                sendMessage(method, arguments);
            };
        })(method);
    }

    return exports;
})();