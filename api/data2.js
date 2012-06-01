(function($, _) { 

    var gatherEmpties = function(assignment, ref, value) {
        var  root = this.root
            ,warnings = root.warnings = root.warnings || {}
            ,overwrites = root.overwrites = root.overwrites || {};

        var isEmpty = (value === null) || (value === undefined) || (value === '')
            || ($.isPlainObject(value) && _.isEmpty(value))
            || ((typeof value.length != 'undefined')  && !value.length)
            || (value instanceof Error)
            || (!value && (this.get('laziness') > 0));
       
        if (ref && (assignment.importance > -1)) {
            if (isEmpty) {
                warnings[ref.crumbs] = value;
            } else {
                delete warnings[ref.crumbs];
            }
            if ((ref.value !== undefined) && (!ref.value._async)) {
                overwrites[ref.crumbs] = value;
            }
        } 
    }

    ,logResult = function(value) {
        if (!this.tail) {
            debug.logGroup('warn', 'Unfilled values', this.warnings);
            debug.logGroup('warn', 'Missing -> Wrappers', this.forgotten);
            debug.logGroup('log', 'Overwrites', this.overwrites);
            debug.logGroup('log', 'Choices', this.choices);

            debug.group('All extracted data');
            debug.log(value);
            debug.groupEnd();  
        }
    }
    ,Async = function(cont, start) {
        var async = function(chunk) {
            var args = arguments;
            return chunk.map(function(chunk) {
                var handler = function(result) {
                    if (args[3] === "exists")
                        return chunk.exists(result, args[1], args[2]).end();

                    if (args[3] === "notexists")
                        return chunk.notexists(result, args[1], args[2]).end();

                    return (args[2] === null)
                    ? chunk.reference(result, args[1], args[3].auto, args[3].filters).end()
                    : chunk.section(result, args[1], args[2], args[3]).end();
                }
                listeners.push(handler);
            })
        };
        var listeners = [], result, done;
        async.onresult = function(f) {
            if (done) {
                f.call(async, result);
            } else {
                listeners.push(f);
            }
        }
        async.finish = function(value) {
            result = value;
            done = true;
            _.each(listeners, function(f) {
                f.call(async, value)
            });
        }
        async._async = true;

        start.call(cont.env().head, cont, async);

        return done ? result : async;
    }

    // TODO: If we want to Mobify this subb'd jQuery when / how should we do it?
    ,anchor = function($root) {
        var anchored = $.sub();

        anchored.context = function() {
            return $root || (Mobify.conf.data ? Mobify.conf.data.$html : '<div>');
        }

        anchored.fn.init = function(selector, context, rootQuery) {
            $root = $root || (Mobify.conf.data && Mobify.conf.data.$html);

            //Zepto won't have $.fn.init
            return ($.fn.init || $).call(this, selector, context || anchored.context(), rootQuery);
        };

        anchored.fn.init.prototype = $.fn;
        
        return anchored;
    }

    $.fn.anchor = function() {
        return anchor(this);
    };

    Mobify.data2 = {
        gatherEmpties: gatherEmpties
        ,makeCont: function(opts) {
            var cont = new Mobify.data2.cont(_.defaults(opts, {laziness: -1 }));
            if (Mobify.config.isDebug) {
                cont
                    .on('assignReference', gatherEmpties)
                    .on('complete', logResult);
            }
            return cont;
        }
        ,Async: Async
        ,M: {
             $ : anchor()
            ,_ : _
            ,async : Async
        }
    };
})(Mobify.$, Mobify._);