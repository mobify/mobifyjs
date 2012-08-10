/**
 * `cont` datastructure API.
 */
(function($, Mobify, undefined) {

    var decodeAssignmentRe = /^([?!]?)(.*)$/
        ,Location = window.Location
        ,Stack = Mobify.data2.stack
        ,Async = Mobify.data2.Async
        ,Cont = Mobify.data2.cont = function(head, parent, idx, len, newEnv) {
            Stack.call(this, head, parent, idx, len);

            if (!parent) {
                var root = this.root = this;
                this.handlers = {}
                this.pending = 0;
            } else {
                this.root = parent.root;
            }

            var oldEnv = parent && parent.env();
            if (newEnv) {
                this.env(oldEnv.extend(newEnv, idx, len));
            } else if (!oldEnv) {
                this.env(new Stack(newEnv || {}));
            }
        };

    $.extend(Cont, {
        importance : {'!' : 1, '?' : -1, '' : 0}
        ,decodeAssignment : function(selector) {
            parse = selector.toString().match(decodeAssignmentRe);
            return {
                 importance: this.importance[parse[1]]
                ,selector: parse[2]
            }
        }
    });

    Cont.prototype = $.extend(new Stack(), {
         extend: function(head, idx, len, env) {
            return new Cont(head, this, idx, len, env);
        }
        ,env: function(value) {
            return (value !== undefined)
                ? this.set('env', value)
                : this.get('env');
        }
        ,source: function(value) {
            return (value !== undefined)
                ? this.set('source', value)
                : this.get('source');
        }
        ,all: function() {
            var env;
            for (env = this.env(); env.tail.tail; env = env.tail);
            return env.head;
        }
        ,blankTarget: function() {
            var source = this.source();
            if ($.isArray(source)) return [];
            if ($.isPlainObject(source)) return {};
        }
        ,_eval : function(source) {
            var root = this.root;

            var innerCont = this.extend({source: source}, this.index, this.length);
            //innerCont.head.root = innerCont;

            var result = innerCont.eval();
            return result;
        }
        ,eval: function(source) {
            if (source !== undefined) {
                return this._eval(source);
            }
            var blank = this.blankTarget();
            var value = blank
                    ? this.evalCollection(blank)
                    : this.evalLeaf()
                ,root = this.root;
            if (!this.parent && (this === root)) {
                if (root.pending) {
                    if (!root.incomplete) {
                        root.incomplete = true;
                        this.on('assignReference', function() {
                            if (!root.pending) {
                                root.emit('complete', [this.all(), this]);
                            }
                        });
                    }
                } else root.emit('complete', [value, this]);
            }
            return value;
        }        
        ,evalLeaf : function() {
            var source = this.source();
            try {
                if (!source) return source;

                return ($.isFunction(source) && !source._async)
                    ? source.call(this.env().head, this)
                    : source;
            } catch (e) { return e; }
        }   
        ,evalCollection : function(value) {
            var source = this.source(),
                sourceLength = source.length,
                continuation = this;
 
            $.each(source, function(idx, sourceFragment) {
                if (sourceFragment && (sourceFragment.jquery || sourceFragment.nodeType)
                    && (typeof idx == "string") && idx.indexOf('$')) {
                    var root = continuation.root;
                    var forgotten = root.forgotten = root.forgotten || [];
                    forgotten.push([idx, sourceFragment]);
                }
                continuation
                    .extend({source: sourceFragment}, idx, sourceLength, value)
                    .evalReference();
            });
            return value;
        }

        ,evalReference : function() {
            
            var ref, value, cont = this 
              , assignment = Cont.decodeAssignment(this.index);
            
            if (assignment.importance >= this.get('laziness')) {
                this.ref = ref = this.env().ref(assignment.selector, true);
                if (!ref) {
                    Mobify.console.warn(assignment.selector
                        , " has a syntax error or points to object that does not exist");
                    return;
                }
            } else return;
            value = this.eval();
            if (value && value._async) {

                ref.value = value;
                if (ref.target && ref.key) {
                    ref.target[ref.key] = value;
                }
                var root = cont.root;

                value.onresult(function(value) {
                    root.pending -= 1;
                    cont.assignReference(assignment, ref, value);
                });
                
                root.pending += 1;
            } else this.assignReference(assignment, ref, value);
            return value;
        }
        ,assignReference: function(assignment, ref, value) {
            if (!(value instanceof Error)) {
                if (ref.target && ref.key) {
                    ref.target[ref.key] = value;
                } else if (this.tail) {
                    value = new Error(assignment.selector + " value can't be saved to " + ref.crumbs);
                }
            }
            this.emit('assignReference', [assignment, ref, value]);
            if (Mobify.config.isDebug) Mobify.timing.addSelector(ref.crumbs);
            
            return value;            
        }
        ,choose : function() {
            var cont = this
                ,root = cont.root
                ,forgotten = root.forgotten = root.forgotten || []
                ,branches = arguments
                ,choices = root.choices = root.choices || {}
                ,chosen = ([].some.call(branches, function(branch, idx) {
                    var attempt = new Mobify.data2.cont({source: branch, laziness: 1});
                    attempt.root = attempt;
                    attempt.env(cont.env().extend({}));
                    
                    attempt.on('assignReference', Mobify.data2.gatherEmpties).eval();
                    
                    [].push.apply(root.forgotten, attempt.forgotten || []);

                    for (var firstWarning in attempt.warnings) break;
                    if (!firstWarning) chosen = branch;
                    return !firstWarning;
                }), chosen)
                ,chosenCont = cont.extend({source: chosen}, cont.index, cont.of);
            
            if (chosen) {
                return choices[cont.ref.crumbs] = chosenCont.eval();
            }
        }
        ,map: function(source, evaluatable) {
            var sourceLength = source.length
                ,continuation = this
                ,result;
 
            result = $.map(source, function(sourceFragment, idx) {
                var cont = continuation
                    .extend({source: evaluatable}, idx, sourceLength, {
                        $: sourceFragment.tagName && $(sourceFragment).anchor()
                        , KEY: idx, LEN: sourceLength, THIS: sourceFragment
                    });
                return cont.eval();
            });
            return result;            
            
        }
        ,ajax: function(params, evaluatable) {
            return Async(this, function(cont, async) {
                $.ajax(cont.eval(params))
                    .success( function(responseData, status, xhr) {
                        if (!evaluatable) {
                            async.finish(responseData);
                        } else if (typeof responseData !== "string") {
                            cont.env(cont.env().extend({THIS: responseData}));
                            async.finish(cont.eval(evaluatable));
                        } else {
                            var context = $(Mobify.html.disable(responseData));
                            cont.env(cont.env().extend({THIS: context, $: context.anchor()}));
                            async.finish(cont.eval(evaluatable));
                        }
                    }).error(function() {
                        async.finish(null);
                    })
            });
        }
        ,tmpl: function(template, data) {
            var args = arguments;
            if (template instanceof Array) template = template[0];

            return Async(this, function(cont, async) {
                var base = dust.makeBase({ lib_import: Mobify.ark.dustSection });

                if (args.length == 1) data = cont.all();
                dust.render(template, base.push(data), function(err, out) {
                    if (err) {
                        async.finish(out);
                        Mobify.console.die(err);
                    } else async.finish(out);
                });
            });
        }
        ,data: function(selector, value) {
            var  get = (value === undefined)
                ,ref = this.env().ref(selector);

            if (!ref) return;

            return get
                ? ref.value
                : ref.target[ref.key] = value;
        }
        ,on: function(event, handler) {
            var allHandlers = this.root.handlers,
                handlers = allHandlers[event] = allHandlers[event] || [];

            handlers.push(handler);           
            return this;
        }
        ,emit: function(event, args) {
            var current = this
                ,continuation = this
                ,allHandlers = this.root.handlers;

            $.each(allHandlers[event] || [], function(i, handler) {
                handler.apply(continuation, args);
            });
        }
    });

})(Mobify.$, Mobify);