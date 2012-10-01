define(["mobifyjs/mobifyjs", "mobifyjs/timing", "mobifyjs/iter"], function(Mobify, timing, iter) {

    if (!console.group) {
        console.group = console.log;
        console.groupEnd = function(){};
    }

    iter.extend(console, {
        logCollapsedGroup : function(fn, title, obj) {
            return this.logGroup(fn, title, obj, !!console.groupCollapsed);
        }
      , logGroup : function(fn, title, obj, _collapse) {
            var justStarted = true;
            obj.forEach(function(value, key) {
                if (justStarted) {
                    _collapse ? console.groupCollapsed(title) : console.group(title);
                }

                if (typeof key == "number") {
                    console[fn](value);
                } else {
                    console[fn](key, value);
                }
                
                justStarted = false;
            });

            if (!justStarted) console.groupEnd();
        }
    });

    timing.emit = function() {
        console.logTiming && console.logTiming();
        console.logMObjects && console.logMObjects();  
    };

    Mobify.die = function() {
        var args = [].slice.call(arguments);
        console.group('(T_T) Fatal error (T_T)');
        console.error.apply(console, args);
        console.groupEnd();

        throw args;
    }
});