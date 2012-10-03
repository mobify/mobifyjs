define(["./mObject", "./mobifyjs", "cond!./log.mObject?dev"], function(MObject, Mobify) {

    var staticMethods = {
        make: function() {
            var result = new MObject();
            result._M = this;
            return result.set.apply(result, arguments);
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
            callback = callback || function() { return M._emitTemplatingResult.apply(M, arguments); }
            if (template instanceof Array) template = template[0];
            if (!template) return callback("No template name provided to .tmpl() call");

            var base = dust.makeBase({});
            base = base.push(this._sourceData).push(this._sourceData.config).push(data);
            dust.render(template, base, callback);
        }
      , _emitTemplatingResult: function(err, out) {
            this.end(out);
            err && Mobify.die(err);
        }
    };

    return MObject.bindM = function(sourceData, completionCallback) {
        var boundM = function() {
            return staticMethods.make.apply(boundM, arguments);
        }

        boundM._sourceData = sourceData;
        boundM.end = completionCallback;

        for (var key in staticMethods) boundM[key] = staticMethods[key];

        return boundM;
    };
   
});