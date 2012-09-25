define(["./mobifyjs", "./extractHTML", "./iter", "dust"], function(Mobify, html, iter, dust) {

var Context = dust.makeBase({}).constructor
  , Chunk = dust.stream('', {}).head.constructor
  , oldBlock = Chunk.prototype.block;

["exists", "notexists", "reference", "section"].forEach(function(name) {
    var oldFn = Chunk.prototype[name];
    var needsExecutionWrapper = name.match("exists");

    Chunk.prototype[name] = function(elem, context, bodies, extras) {
        if (elem && elem._callable) elem = elem._callable;

        if (needsExecutionWrapper && (typeof elem === "function")) {
            elem = elem(this, context, bodies, 'notexists');
            if (elem instanceof Chunk) {
              return elem;
            }
        }            

        return oldFn.call(this, elem, context, bodies, extras);
    }
});

Chunk.prototype.block = function(elem, context, bodies) {
    var topElem = elem ? elem.shift() : undefined;
    if (topElem) {          
        context = new context.constructor(
            context.stack
          , Mobify.iter.extend(context.global || {}, {
                '_SUPER_': function(_elem, context, _bodies) {
                    return _elem.block(elem, context, bodies);
                }})
          , context.blocks
        );
    }
    
    return oldBlock.call(this, topElem, context, bodies);
};

Context.prototype.getPath = function(cur, down) {
    var ctx = this.stack
      , len = down.length;

    if (cur && len === 0) return ctx.head;
    if (!ctx.isObject) return undefined;

    ctx = this.get(down[0]);

    var i = 1;
    while (ctx && i < down.length) {
        if (typeof ctx.done === "function" && !ctx.done()) {
            return ctx._delayInspection();
        } else {
            ctx = ctx[down[i++]];
        }
    }        
    return ctx;
};    

Context.prototype.getBlock = function(key) {
    var blocks = this.blocks;

    if (!blocks) return [];

    blocks = blocks.map(function(block) {
        return block[key];
    }).filter(Mobify.iter.identity);
    return blocks;
}
    
var array = []
  , likeArray = function(candidate) {
        return (typeof candidate != 'string') 
            && (typeof candidate.length == 'number')
            && (!candidate.tagName);
    };

// Additional dust filters
// html returns node outerHTML
// innerHTML returns node innerHTML
// openTag and closeTag return first opening and last closing tags from a string
Mobify.iter.extend(dust.filters, {
    h: function(node) {
        if (!node) return '';
        if (likeArray(node)) {
            return array.map.call(node, dust.filters.h).join('');
        }

        return (typeof node.outerHTML !== 'undefined')
            ? node.outerHTML
            : dust.escapeHtml(node);
    }
    
  , innerHTML: function(node) {
        if (!node) return '';
        if (likeArray(node)) {
            return array.map.call(node, function(el) {
                return el.innerHTML || el.nodeValue;
            }).join('')
        } else {
            return node.innerHTML || node.nodeValue;
        }
    }
  , openTag: Mobify.html.openTag

  , closeTag: Mobify.html.closeTag
});

var conditionalHelper = function(chunk, context, bodies, accept) {
    if (accept) {
        return bodies.block(chunk, context);
    } else if (bodies['else']) {
        return bodies['else'](chunk, context);
    } else {
        return chunk;
    }
}

Mobify.iter.extend(dust.helpers, {
    first: function(chunk, context, bodies) {
        var accept = context.stack.index === 0;
        return conditionalHelper(chunk, context, bodies, accept);
    },
    last: function(chunk, context, bodies) {
        var accept = context.stack.index === context.stack.of - 1;
        return conditionalHelper(chunk, context, bodies, accept);
    }
})
    
dust.isArray = iter.isArray;

var oldLoad = dust.load;
dust.load = function(name, chunk, context) {
    return name ? oldLoad.apply(this, arguments) : chunk;
}
                
});