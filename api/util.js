(function(window) {

    var Mobify = window.Mobify
      , $ = Mobify.$
      , _ = Mobify._
      , config = Mobify.config
      , math = Math
      , undefined;

    // ###
    // # Logging
    // ###
        
    debug.die = function() {
        var args = _.toArray(arguments);
        debug.group('(T_T) Fatal error (T_T)')
        debug.error.apply(debug, args);
        debug.groupEnd();

        // unmobify() sets `Mobify.bail` when run. If set, we died in unmobify,
        // and running it again won't help.
        if (!config.isDebug && !Mobify.bail) {
            Mobify.unmobify();
        }

        throw args;
    };

    debug.logGroup = function(fn, title, obj) {
        var noneWritten = true;
        _.each(obj, function(value, key) {
            noneWritten && debug.group(title);
            if (typeof key == "number") {
                debug[fn].apply(window, value);
            } else {
                debug[fn](key, value);
            }
            
            noneWritten = false;
        });

        noneWritten || debug.groupEnd();
    };

    // ###
    // # Utils
    // ###
    
    // Set optout cookie and reload to goto desktop.
    // V3.0: mobify=0
    // V3.X: mobify-js=-1
    // V6.X: mobify-path=
    //
    // `url`: Optional url to redirect to after opting out.
    Mobify.desktop = function(url) {
        var tagVersion = config.tagVersion
          , val = tagVersion > 5 ? '-path=' : (tagVersion ? '-js=-1' : '=0')
        
        document.cookie = 'mobify' + val + '; path=/;';

        if (url) {
            location = url;
        } else {
            location.reload();
        }
    };
    
    // i18n function converts in a list of language types and data and returns
    // a function that allows you to grab translation keys from that data
    Mobify.i18n = function(list, data) {
        list.push("DEFAULT");

        var i18nlookup = function(key) {
            for(var i = 0; i < list.length; i++) {
                var value = data[list[i]][key];
                if (value) return value;
           }
        }
        return i18nlookup;
    };
})(this);
