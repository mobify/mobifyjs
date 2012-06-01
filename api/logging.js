(function(Mobify, $) { 
    var console = Mobify.console = window.console;
    if (!console.group) {
        console.group = console.log;
        console.groupEnd = function(){};
    }
    $.extend(console, {
        die : function() {
            var args = [].slice.call(arguments);
            console.group('(T_T) Fatal error (T_T)')
            console.error.apply(console, args);
            console.groupEnd();

            if (!Mobify.config.isDebug) {
                Mobify.html.unmobify();
            }

            throw args;
        },
        logGroup : function(fn, title, obj) {
            var noneWritten = true;
            $.each(obj, function(key, value) {
                noneWritten && console.group(title);
                if (typeof key == "number") {
                    console[fn].apply(console, value);
                } else {
                    console[fn](key, value);
                }
                
                noneWritten = false;
            });

            noneWritten || console.groupEnd();
        }
    });
})(Mobify, Mobify.$);