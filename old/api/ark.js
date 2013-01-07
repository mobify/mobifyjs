/* Ark saves scripts before the flood (document.open) and can restore them after.
 */
(function(Mobify) {

var contraband = {}

  , index = 0

  , nextId = function() {
        return "_generatedID_" + index++;
    }

    // `document.open` wipes objects in all browsers but WebKit.
  , documentOpenWipesObjects = !navigator.userAgent.match(/webkit/i)
  , _store = function(name, fn) {
        var bucket = contraband[name] = contraband[name] || [];
        bucket.push(fn);
    }

  , ark = Mobify.ark = {
        // Store a script in the ark.
        // `name`: Storage key.
        // `fn`: What to store.
        // `passive`: Whether `fn` should be executed now or not.
        store: function(name, fn, passive) {
            if (typeof name == 'function') {
                passive = fn;
                fn = name;
                name = nextId();
            }
            
            if (!passive && fn.call) {
                if (documentOpenWipesObjects) {
                    _store(name, fn);
                }
                fn();
            } else {
                _store(name, fn);
            }

        }

        // Returns the HTML to restore a script from the ark.
      , load: function(sNames) {
            var result = [];
            if (sNames) {
                var aNames = sNames.split(/[ ,]/);
                for (var i = 0, l = aNames.length; i < l; ++i) {
                    var bucket = contraband[aNames[i]];
                    if (!bucket) continue;

                    for (var j = 0, bl = bucket.length; j < bl; ++j) {
                        var fn = bucket[j];
                        if (fn.call) fn = '(' + fn + ')()';
                        result.push('<script>' + fn + '</script>');                        
                    }
                }
            } else {
                for (var key in contraband) {
                    result.push(Mobify.ark.load(key));
                }
            }
            return result.join('\n');
        }

        // Dust helper to restore scripts from the ark.
      , dustSection: function(chunk, context, bodies, params) {
            var output = ark.load(params && params.name);
            return chunk.write(output);
        }
    };

})(Mobify);