(function($, _) {
	
	// Processing for data that will be fed to templating engine
	// Data takes form of a regular JSON object, and is evaluated by:
	// * Walking to inspect values inside arrays and objects
	// * Returning >value< from {BASIC : >value< } expression without further processing
	// * Replacing {CSS : >value< } with result of evaluation of selector through jQuery selector engine

/* Feature use example	
play: {
	"$root": _$('#main-nav'),
	a: _$('a'),
	b: M._data('a').parent(),
	extra:  M._map(
		_$("> div", M._data('*sliderPanel')), {
			cat: "orange",
			product: M._data('*@this').attr('id'),
			text: M._data('*@idx')
		}
	)						
} */

var jQuery = $;
	
	var	isCollection = function(leaf) {
			if (!leaf) { 
				return false;
			}
			return _.isArray(leaf)
				|| ($.isPlainObject(leaf)
					&& !leaf.deferrable)
					&& !(window.Location && (leaf instanceof window.Location));
		},
		
		evaluateLeaf = function(state, src) {
			var ctx = state.ctx;
			var env = state.env;
			var result = src;
				
            // console.log(ctx, env, result);

			if (!result) {
				return result;
			}
			if (_.isFunction(result)) {
                try {
					result = result.call(this, state);
				} catch (e) {
					debug.error(e);
					result = undefined;
				}
			}

			if (result && result.deferrable) {
				result = result._eval(state);
			}
			 
			return result;
		},
		
		dataSelectorRe = /(\.|\*|\?)/i,
        
		evalBasicDataSelector = function(state, selector, address) {		
			var env = state.env,
				result = env.stack,
				getAddress,
				token,
				mandatory = true,
				predicate = '.',
			
			selector = selector.split(dataSelectorRe);

			for (var i = 0; i < selector.length; i +=1 ) {
				token = selector[i];
				getAddress = address && (i === selector.length - 1);
				switch (token) {
					case "":
						continue;
					break;
					case '?':
						mandatory = false;
					break;
					case '.': case '*':
						predicate = token;
					break;
					default:
						if (predicate === ".") {
							if ("head" in result) {
								result = result.head ? result.head : env.global;
							}

							if (getAddress) {
								return [result, token, mandatory];
							} else {
								result = result[token];
							}													
						} else if (predicate === "*") {
							while (true) {
								if (!result || !("head" in result)) {
									result = env.global;
									break;
								}
								if (result.head && (token in result.head)) {
									result = result.head;
									break;
								}						
								result = result.tail;
							}

							if (getAddress) {
								return [result, token, mandatory];
							} else {
								result = result[token];
							}
						}
					break;
				}
			}
			if (!getAddress) return result;
		},		
		
		dataSelectorIncludeRe = /([\[\]\{\}])/i,	
		
        evalDataSelector = function(state, selector, address) {		
        	var stack = [[]];
			var token, result;

			if (_.isNumber(selector)) {
				selector = selector.toString();
			}
			if (_.isString(selector)) {
				selector = selector.split(dataSelectorIncludeRe);
			}
			for (var i = 0; i < selector.length; i +=1 ) {
				token = selector[i];
				switch (token) {
					case '':
						continue;
					break;				
					case '{' : case '[' :
						stack.push([]);
					break;
					case '}' : case ']' :
						result = evalBasicDataSelector(state, stack.pop().join('')); 
						if (_.isUndefined(result)) {
							return;
						}
						stack[stack.length - 1].push(result);
					break;
					default:
						stack[stack.length - 1].push(token);
				}
			}
			return evalBasicDataSelector(state, stack.pop().join(''), address)
		},
		
		evaluateNode = function(state, src, key, len) {
			var ctx = state.ctx;
			var env = state.env;
			var srcIsCollection = isCollection(src);
			var computedKey = evalDataSelector(state, key, true);
			var parentDest = computedKey[0];
			var destKey = computedKey[1];
			var mandatory = computedKey[2];
			var path = ctx.get('path').concat(key);
			var innerEnv, innerCtx, dest;
                        						
			if (srcIsCollection && _.isUndefined(parentDest[destKey])) {
				dest = parentDest[destKey] = _.isArray(src) ? [] : {};
			}	
			
			innerEnv = env.push(dest, destKey, len),					
			innerCtx = ctx.push({
				src: src,
				dest: dest,
				path: path
			}, destKey, len);

			if (srcIsCollection) {
				evaluateCollection({ctx: innerCtx, env: innerEnv});
				return dest;
			} else {
				var result = evaluateLeaf({ctx: innerCtx, env: env}, src);
				parentDest[destKey] = result;
				// if (mandatory && isFalsey(result)
				if (mandatory && ((result === null) || (result === undefined) || (result === '')
					|| ($.isPlainObject(result) && _.isEmpty(result))
					|| ((typeof result.length != 'undefined')  && !result.length))) {
					state.ctx.get('warnings').push([path.join('.'), result]);
				}
			}
		},
		
		evaluateCollection = function(state) {
			_.each(state.ctx.get('src'), function(src, key, parentSrc) {
				evaluateNode(state, src, key, parentSrc.length);
			});
		},
		
        M = {
    		$ : Mobify.$,
    		_ : Mobify._,
    		_$: Mobify.deferrable.jQuery,
    		map: function(state, value, src) {
				if (value && value.deferrable) {
					value = value._eval(state);
				}
				
				if (value.jquery) value = value.toArray();
				var newDest = [],
					newState = {
						ctx: state.ctx.push({src: src, dest: newDest})
					};
				
				_.each(value, function(v, key) {
					if (v.nodeType) v = $(v);
					newState.env = state.env.push({"@this" : v, "$root": v, "@idx" : key}).push(newDest);
					evaluateNode(newState, src, key, value.length);
				});
				return newDest;
    		},
    		_map: function(value, src) {
    			return function(state) {
    				return M.map(state, value, src);
    			}
    		},
    		data: function(state, selector, value) {
    			var set = !_.isUndefined(value);
				var address, result;
				if (set) {
    				address = evalBasicDataSelector(state, selector, true);
    				if (value && value.deferrable) {
    					value = value._eval(state);
    				}
					address[0][address[1]] = value;
				} else {
        			value = evalBasicDataSelector(state, selector, false);
        			if (value && value.deferrable) {
    					value = value._eval(state);
    				}
        		}    
   				return value;   			
    		},
    		_data: function(selector, value) {
    			return Mobify.deferrable.constructor(Mobify.deferrable.actuals, "data", arguments);
    		},

    		verbatim: _.identity,
   		
    		choose: function() {
    			var map = arguments,
    				str = Mobify.config.location.pathname.slice(1);

    			return function(state) {
    				var result = _(map).detect(function(block) {
    					var value,
    						key = block[1],
    						detector = block[0];
    						
    					if (_.isString(detector)) {
    						return $(detector, state.env.get('$root')).length;
    					} else if (detector.deferrable) {
    						value = detector._eval(state);
    						return (value.jQuery || _.isArray(value))
    								? value.length
    								: value;
    					} else if (detector instanceof RegExp) {
    						return detector.test(str);
    					} else {
    			            return detector(state);
    			        }
    			    });
    			    if (!result || !("1" in result)) {
		   				debug.group('All extracted data');
		  				debug.log(state.ctx.get('destRoot'));
		   				debug.groupEnd(); 
		   				
		   				debug.die("error: " + state.ctx.get('path').pop() + " did not match any of choose function selectors");
    			    }
    			    
    			    result = evaluateLeaf(state, result[1]);
    			     
    			    state.ctx.get('choices').push([state.ctx.get('path').join('.') + ' chose ' + result]);
					
					return result;
    			}
    		},
    		cond: function(picker) {
    			var map = _.toArray(arguments).slice(1);
    			
    			return function(state) {
		   			var	result,
		   				target = evaluateLeaf(state, picker),
    					match = _(map).detect(function(block) {
	    					return (target === block[0])
	    			    });
    			    
    			    if (!match || !("1" in match)) {
		   				debug.group('All extracted data');
		  				debug.log(state.ctx.get('destRoot'));
		   				debug.groupEnd();    		
		   				     			    
    			    	debug.die("error: cond function in " + state.ctx.get('path').pop() + " was given ", target, ", which did not match any of conditions");	    
    			    }
    			    
    			    match = match[1];
    			    	    			       			    
    			    result = evaluateNode(state, match, state.ctx.stack.index);
    			    state.ctx.get('branches').push([state.ctx.get('path').join('.') + ' conditional was ' + target + ', producing ', result]);
					
					return result;
    			}    		
    		}
    	}, data = {
    		M : M,
    		evaluate: function(state) {
    			var result = {},
    				pending = [],
    				destRoot = {},
    				ctx = dust.makeBase({
    					src: state.data,
    					destRoot: destRoot,
    					dest: destRoot,
    					path: [],
    					warnings: [],
    					branches: [],
    					choices: [],
    					getPath: function() { return this.path; }
    				}),
    				env = dust.makeBase({'$root': state.data.$html}).push(destRoot);
				

   				evaluateCollection({ctx: ctx, env: env});
				
				debug.group('Choices');
   				_.map(ctx.get('choices'), function(log) {
   					debug.log.apply(debug, log);
   				})
   				debug.groupEnd(); 
   				
   				debug.group('Branches');
   				_.map(ctx.get('branches'), function(log) {
   					debug.log.apply(debug, log);
   				})
   				debug.groupEnd();
   				
   				if (ctx.get('warnings').length) {   				
					debug.group('Unfilled values');
	   				_.map(ctx.get('warnings'), function(warning) {
	   					debug.warn.apply(debug, warning);
	   				})
	   				debug.groupEnd();
	   			}
   				
   				debug.group('All extracted data');
  				debug.log(destRoot);
   				debug.groupEnd();
   				
    			return destRoot;
    		}
    		
		
    	};
	
	Mobify.data = data;
	
})(Mobify.$, Mobify._);