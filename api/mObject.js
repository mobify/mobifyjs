(function(Mobify, $) {

var emitDust = function(elem, context, bodies, extras) {
        if (extras === "exists")
            return this.exists(elem, context, bodies);

        if (extras === "notexists")
            return this.notexists(elem, context, bodies);

        return (bodies === null)
        ? this.reference(elem, context, extras.auto, extras.filters)
        : this.section(elem, context, bodies, extras);
    }
  , asyncEmitDust = function(chunk) {
        var mobject = this,
            args = [].slice.call(arguments, 1);

        args.unshift(mobject._dustProxy || mobject);

        return chunk.map(function(chunk) {
            mobject.on("complete", function() {
                emitDust.apply(chunk, args).end();
            })
        });
    };

var MObject = function() {
    var mobject = this;
    this._outstanding = [];
    this._on = { "complete": [], "done": [] };
    this._empties = {};
    this._refs = [];
    this._callable = function() {
        if (mobject.done()) return mobject;
        return asyncEmitDust.apply(mobject, arguments);
    };

    allMObjects.push(this);
};


var decodeAssignmentRe = /^([?!]?)(.*)$/
  , assignmentImportance = {'!' : 1, '?' : -1, '' : 0 }
  , walk = function(isChoose, source) {
        var source = $.isArray(source[0]) ? source[0] : source
          , mobject = this;

        for (var i = 0, l = source.length; i < l; ++i) {
            var addition = source[i];
            try {
                if (typeof addition == "function") {
                    addition.call(mobject, mobject);                    
                } else {
                    $.each(addition, function(key, value) {
                        mobject.set(key, value);
                    });
                }
                if (isChoose) break;
            } catch (e) {
                if (e === mobject._M.stopper) throw e;
            }
        }
        return this;
    }
  , isEmpty = MObject.isEmpty = function(value) {
        return (value === null) || (value === undefined) || (value === '')
            || ((typeof value === "object") && (typeof value.length === "number")
                && !value.length && !value.tagName)
            || (value instanceof Error);
  };

MObject.prototype = {
    done: function() { return !this._outstanding.length }
  , choose: function() { walk.call(this, true, arguments); this._choice = true; return this; }
  , add: function() { walk.call(this, false, arguments); return this; }
  , addTo: function(obj, key) {
        obj.add({key : this});
        return this;
    }
  , get: function(what) {
        var source = $.isArray(what) ? what
            : typeof what === "string" ? what.split('.')
            : arguments;

        var walk = this;
        for (var i = 0, l = source.length; i < l; ++i) {
            if (walk === undefined) return;
            walk = walk[source[i]];
        }
        return walk;
    }
  , _set: function(importance, key, value) {
        if (typeof value === "function") {
            value = value.call(this, this);
        }

        if ((importance !== -1) && (importance || Mobify.config.isDebug)) {
            var valueEmpty = isEmpty(value) || (!value && importance);

            if (!valueEmpty) {
                delete this._empties[key];
            } else if (importance) {
                throw new Error("Missed key " + key);
            } else {
                this._empties[key] = value;
            }
        }
        this[key] = value;
        if (value instanceof MObject) value._refs.push({parent: this, key: key});
    }
  , set: function(key, value) {
        var decoded = decodeAssignmentRe.exec(key);
        var importance = this._nextSet || assignmentImportance[decoded[1]];
        var actualKey = decoded[2];

        this._nextSet = 0;
        this._set(importance, actualKey, value);
        return this;
    }
  , can: function() {
        this._nextSet = -1;
        return this;
    }
  , must: function() {
        this._nextSet = 1;
        return this;
    }
  , on: function(event, fn) {
        var mobject = this;
        this._on[event].push(fn);

        if (event === "complete") this._attemptCompletion();
        return mobject;
    }
  , _attemptCompletion: function() {
        if (this.done()) {
            var completer;
            while (this._on && (completer = this._on.complete.shift())) {
                completer.call(this);
            }
        }
    }
  , async: function(fn) {
        var mobject = this;

        var init = function() {
            fn.call(mobject, mobject, done);
        }
        var done = function(extender) {
            if (extender) mobject.add(extender);

            if (!mobject._outstanding) return;
            var index = mobject._outstanding.indexOf(init);
            mobject._outstanding.splice(index, 1);
            mobject._attemptCompletion();
        };
        mobject._outstanding.push(init);
        init();
        return mobject;
    }
  , end: function(htmlStr) {
        this.outerHTML = htmlStr;
        return this._M.end(this);
    }
  , tmpl: function(template, callback) {
        var M = this._M;
        callback = callback || M._emitTemplatingResult;

        return this.async(function(data, done) {
            return M.tmpl(template, data, function(err, result) {
                callback(err, result);
                done();
            });
        });
    }
  , _delayInspection : function() {
        var ctx = this;
        return this._M().async(function(unwrap, done) {
            unwrap._dustProxy = ctx;
            ctx.on("complete", done);
        });     
    }    
}

var M = {
    make: function() {
        var result = new MObject();
        result._M = this;
        return result.add.apply(result, arguments);
    }
  , require: function(value, reenter) {
        var M = this;
        if (!reenter && typeof value === 'function') return function() {
            return M.require(value.apply(this, arguments), true);
        };
        if (isEmpty(value) || (!value)) throw "Empty value: " + value;
        return value;
  }
  , protect: function(fn, target) {
        var curried = [].slice.call(arguments, 2);
        var M = this;
        return function() {
            var args = [];
            args.push.apply(args, curried);
            args.push.apply(args, arguments);
            try {
                return fn.apply(target || this, args);
            } catch (e) {
                if (e === M.stopper) throw e;
            }
        }
    }
  , run: function() {
        return (this.protect.apply(this, arguments))()
    }
  , stop: function(result) {
        this.stopper.payload = result;
        throw this.stopper;
    }
  , stopper: new Error("END")
  , tmpl: function(template, data, callback) {
        callback = callback || this._emitTemplatingResult;
        if (template instanceof Array) template = template[0];
        if (!template) return callback("No template name provided to .tmpl() call");

        var base = dust.makeBase({ lib_import: Mobify.ark.dustSection })
        base = base.push(this._sourceHTML).push(this._sourceHTML.config).push(data);
        dust.render(template, base, callback);
    }
};

Mobify.mobject = {
    'MObject': MObject
  , 'allMObjects' : []
  , 'M': function(sourceHTML, completionCallback) {
        var boundM = function() {
            return M.make.apply(boundM, arguments);
        }
        boundM._sourceHTML = sourceHTML;
        boundM.$ = sourceHTML.$html.anchor();
        boundM.end = completionCallback;
        boundM._emitTemplatingResult = function(err, out) {
            boundM.end(out);
            err && Mobify.console.die(err);
        };

        $.extend(boundM, M);
        return boundM;
    }
};
var allMObjects = Mobify.mobject.allMObjects;

})(Mobify, Mobify.$);