(function($, _) {
	var _toString = function() {
		return this._toString
			? this._toString()
			: '"' + this.toString() + '"';
	};
	
	var deferrable = Mobify.deferrable = {
		actuals: {
			_$: function(state, selector, context, rootQuery) {	
				return $(selector, context || state.env.get('$root'), rootQuery);
			},
			data: function() {
				var M = Mobify.data.M;
				return M.data.apply(M, arguments);
			},
			_toString: function() { return ''; }
		},
		constructor: function(target, name, args) {
			return new this.fn._init(target, name, args);
		},
		jQuery: function() {
			return Mobify.deferrable.constructor(Mobify.deferrable.actuals, "_$", arguments);
		},
		chain: function(name) {
			return function() {
				return Mobify.deferrable.constructor(this, name, arguments);
			}
		},
		_throw: {}
	}
	

	
	deferrable.fn = {
		deferrable: "deferrable",
		
		// Make sure that _.isArray does not consider deferrables to be arrays
		callee : true,
		_toString : function() {
			var sTarget = this.target && _toString.apply(this.target);
			sTarget = sTarget ? sTarget + '.' : "";

			var aArgs = _.map(this.args, function(arg) {
				return _toString.apply(arg);
			});
			var sArgs = this.args.length ? aArgs.join(', ') : "";
			return sTarget + this.name + '(' + sArgs + ')';
		},
		_init: function(target, name, args) {
			this.target = target;
			this.name = name;
			this.args = _.toArray(args);
		},
		
		_eval: function(state) {
			var result = this.__eval(state);
			Mobify.timing.addPoint('    Selector ' + this._toString());					
			if (result == deferrable._throw) {
				return;
			}
			return result;
		},
			
		__eval: function(state) {
			var result,
				target = this.target,
				name = this.name,
				args = _(this.args).map(function(arg) {
					if (arg && arg.deferrable) {
						var evaluatedArg = arg.__eval(state);
						if (evaluatedArg == deferrable._throw) {
							result = deferrable._throw;						
							return deferrable._throw;
						}
						return evaluatedArg;
					} else if (_.isFunction(arg)) {
						return function() {
							return arg.apply(this, [state].concat(_.toArray(arguments)))
						}
					} else return arg;
				});
			
			if (target.deferrable) {
				target = target.__eval(state);	
				if (target == deferrable._throw) {
					return target;			
				}
			}	
				
			if (!result) {
				try {						
					if (target === deferrable.actuals) {
						result = target[name].apply(target, [state].concat(args));
					} else if (name == "_get") {
						result = target[args[0]];
					} else {
						result = target[name].apply(target, args);
					}
				} catch(err) {
					result = deferrable._throw;
				}
			}
			
			return result;
		}	
	};
	
	var arrayMethods = "pop|push|reverse|shift|sort|splice|unshift|concat|join|slice|toSource|toString|indexOf|lastIndexOf|filter|forEach|every|map|some|reduce|reduceRight".split("|"),
		stringMethods = "charAt|charCodeAt|concat|indexOf|lastIndexOf|localeCompare|match|quote|replace|search|slice|split|substr|substring|toLocaleLowerCase|toLocaleUpperCase|toLowerCase|toSource|toString|toUpperCase|trim|trimLeft|trimRight|valueOf".split("|"),
		elementMethods = "insertAdjacentElement|insertAdjacentHTML|insertAdjacentText|getElementsByTagName|getAttribute|querySelectorAll|webkitMatchesSelector|getElementsByClassName|contains|getBoundingClientRect|querySelector|hasAttribute|getAttributeNode|getAttributeNS|getElementsByTagNameNS|removeAttributeNS|getClientRects|scrollByPages|setAttributeNode|setAttributeNS|hasAttributeNS|blur|scrollIntoViewIfNeeded|setAttribute|scrollByLines|removeAttribute|setAttributeNodeNS|removeAttributeNode|getAttributeNodeNS|focus|scrollIntoView|addEventListener|appendChild|cloneNode|removeEventListener|compareDocumentPosition|insertBefore|removeChild|hasAttributes|isSupported|isEqualNode|dispatchEvent|isDefaultNamespace|hasChildNodes|normalize|replaceChild|isSameNode|lookupPrefix|lookupNamespaceURI".split('|'),
		replacedMethods = [];

	var x = $();
	for (var i in x) {
		if (_.isFunction(x[i])) {
			replacedMethods.push(i);
		}
	}
	
	var all = replacedMethods.concat(['_get'], arrayMethods, stringMethods, elementMethods);
	_.each(all, function(x) {
		deferrable.fn[x] = deferrable.chain(x);
	});

	deferrable.fn._init.prototype = deferrable.fn;
	
})(Mobify.$, Mobify._);


	