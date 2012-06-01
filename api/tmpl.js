(function($, _) {
	var Async = Mobify.data2 && Mobify.data2.Async;

	var Context = dust.makeBase({}).constructor,
        Chunk = dust.stream('', {}).head.constructor,
		oldExists = Chunk.prototype.exists,
		oldNotExists = Chunk.prototype.notexists,
		oldBlock = Chunk.prototype.block;
	
	Chunk.prototype.exists = function(elem, context, bodies) {
		if (typeof elem === "function") {
		    elem = elem(this, context, bodies, 'exists');
		    if (elem instanceof Chunk) {
		      return elem;
		    }
		}
		return oldExists.call(this, elem, context, bodies);
	};

	Chunk.prototype.notexists = function(elem, context, bodies) {
		if (typeof elem === "function") {
		    elem = elem(this, context, bodies, 'notexists');
		    if (elem instanceof Chunk) {
		      return elem;
		    }
		}
		return oldNotExists.call(this, elem, context, bodies);
	};

	Chunk.prototype.block = function(elem, context, bodies) {
        var topElem = elem ? elem.shift() : undefined;
		if (topElem) {          
			context = new context.constructor(
				 context.stack
				,_.extend(
					context.global || {},
					{ '_SUPER_' : function(_elem, context, _bodies) {
                        return _elem.block(elem, context, bodies);                       
                    }})
				,context.blocks);
		}
		
		return oldBlock.call(this, topElem, context, bodies);
	};


	var descend = function(ctx, down, i) {
        while (ctx && i < down.length) {
        	if (ctx._async) {
        		var unwrap = Async($.noop);
        		ctx.onresult.push(function(result) {
    				unwrap.result(descend(result, down, i));
    			});
    			return unwrap;
        	}
            ctx = ctx[down[i]];
            i++;
        }
        
        return ctx;
	}

    Context.prototype.getAscendablePath = function(cur, down) {
        var ctx = this.stack;

        if (cur) return this.getPath(cur, down);
        if (!ctx.isObject) return undefined;

        ctx = this.get(down[0]);

        return descend(ctx, down, 1);
    };    
    Context.prototype.getBlock = function(key) {
        var blocks = this.blocks;

        if (!blocks) return [];

        blocks = _.compact(_.pluck(blocks, key));
        return blocks;
    }
	
	// Additional dust filters
	// html returns node outerHTML
	// innerHTML returns node innerHTML
	// openTag and closeTag return first opening and last closing tags from a string
  	$.extend(dust.filters, {
  		h: function(value) {
  			if (_.isArray(value)) {
  				return _.map(value, dust.filters.h).join('');
  			}
  			
  			if (value && value.nodeType) {
  				value = $(value);
  			}

	  		return (value.outerHTML	&& value.outerHTML.apply)
				? value.outerHTML()
				: dust.escapeHtml(value);
	  	},

  		html: function(nodes) {
  			var wrapper = $(document.createElement('div')).append(
		  		$(nodes).filter(function(i, el) {
	  				return el && el.nodeType;
		  		})
		  	);
	  		return wrapper.html();
	  	},
	  	
	  	innerHTML: function(node) {
	  		if (node && node.jquery) {
	  			node = node.toArray();
	  		}
	  		if (_.isArray(node)) {
	  			var res = [];
	  			for (var i = 0; i < node.length; i+= 1) {
	  				res.push($(node).html());
	  			}
	  			return res.join('');
	  		} else {
	  			return $(node).html();
	  		}
	  	},
	  	
	  	openTag: function(node) {
	  		if (!node) return '';
	  		if (node.length) {
		  		node = node[0];
		  	}
	  		var attrs = $(node).mapAttributes();
	  		//alert(JSON.stringify(attrs));
	  		var attrStr = "", val;
	  		for (var key in attrs) {
	  			attrStr += ' ' + key + '="' + attrs[key] + '"';
	  		}

	  		var res = '<' + node.nodeName.toLowerCase() + attrStr + '>';
	  		return res;
	  	},
	  	
	  	closeTag: function(node) {
            var firstNode = node.length ? node[0] : node;
	  		return firstNode ? '</' + firstNode.nodeName.toLowerCase() + '>' : "";
	  	}
  	});

  	$.extend(dust.helpers, {
  		first: function(chunk, context, bodies) {
		    if (context.stack.index === 0) {
		    	return bodies.block(chunk, context);
		    }
		    if (bodies['else']) return bodies['else'](chunk, context);
		    return chunk;
	    },
	    last: function(chunk, context, bodies) {
		    if (context.stack.index === context.stack.of - 1) {
		    	return bodies.block(chunk, context);
		    }
		    if (bodies['else']) return bodies['else'](chunk, context);
		    return chunk;
	    }
  	})
  	
  	var oldIsArray = dust.isArray;
  	dust.isArray = function(arr) {
  		return (arr && arr.jquery) || oldIsArray(arr);
  	}

  	var oldLoad = dust.load;
  	dust.load = function(name, chunk, context) {
		return name ? oldLoad.apply(this, arguments) : chunk;
  	}
      			
})(Mobify.$, Mobify._);
