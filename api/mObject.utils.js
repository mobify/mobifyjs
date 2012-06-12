(function(Mobify, $) {
    var MObject = Mobify.MObject;
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
            if (MObject.isEmpty(value) || (!value)) throw "Empty value: " + value;
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

    var bindM = function(sourceHTML, completionCallback) {
        var boundM = function() {
            return M.make.apply(boundM, arguments);
        }
        boundM._sourceHTML = sourceHTML;
        boundM.$ = $(sourceHTML.document).anchor();
        boundM.end = completionCallback;
        boundM._emitTemplatingResult = function(err, out) {
            boundM.end(out);
            err && Mobify.console.die(err);
        };

        $.extend(boundM, M);
        return boundM;
    };

    MObject.evalConf = function(fn, source, callback) {
        var called = false;
        var callbackOnce = function(result) {
            if (called) return;
            called = true;

            if (result instanceof Error) result = result.payload;
            callback(result);
        }

        try {
            var boundM = bindM(source, callbackOnce);
            fn.call(boundM, source, callbackOnce);
        } catch (e) {
            callbackOnce(e);
        }
    };
    
})(Mobify, Mobify.$);