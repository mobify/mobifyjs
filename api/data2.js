(function($) { 
    
var console = Mobify.console

  , gatherEmpties = function(assignment, ref, value) {
        var root = this.root
          , warnings = root.warnings = root.warnings || {}
          , overwrites = root.overwrites = root.overwrites || {}
          , isEmpty = (value === null) || (value === undefined) || (value === '')
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

  , logResult = function(value) {
        if (!this.tail) {
            console.logGroup('warn', 'Unfilled values', this.warnings);
            console.logGroup('warn', 'Missing -> Wrappers', this.forgotten || []);
            console.logGroup('log', 'Overwrites', this.overwrites);
            console.logGroup('log', 'Choices', this.choices || []);

            console.group('All extracted data');
            console.log(value);
            console.groupEnd();  
        }
    }

  , Async = function(cont, start) {
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
                });
            }

          , listeners = [], result, done;

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
            $.each(listeners, function(i, f) {
                f.call(async, value)
            });
        }

        async._async = true;

        start.call(cont.env().head, cont, async);

        return done ? result : async;
    }

  , anchor = function($root) {
        var rootedQuery = function(selector, context, rootQuery) {
                $root = $root || (Mobify.conf.data && Mobify.conf.data.$html);

                return ($.fn.init || $.zepto.init).call(this, selector, context || anchored.context(), rootQuery);
            }

          , anchored = $.sub(rootedQuery); 

        anchored.context = function() {
            return $root || (Mobify.conf.data ? Mobify.conf.data.$html : '<div>');
        }

        if (!anchored.zepto)  {
            anchored.fn.init = rootedQuery;
            anchored.fn.init.prototype = $.fn;
        }

        return anchored;
    };

$.sub = $.sub || function(rootedQuery) {
    $.extend(rootedQuery, $);
    rootedQuery.zepto = $.extend({}, $.zepto);
    return rootedQuery;
};

$.fn.anchor = function() {
    return anchor(this);
};

Mobify.data2 = {
    gatherEmpties: gatherEmpties

  , makeCont: function(opts) {
        var cont = new Mobify.data2.cont($.extend({}, {laziness: -1 }, opts));
        if (Mobify.config.isDebug) {
            cont
                .on('assignReference', gatherEmpties)
                .on('complete', logResult);
        }
        return cont;
    }

  , Async: Async

  , M: {
        $ : anchor(), 
        async: Async
    }
};
    
})(Mobify.$);