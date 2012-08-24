(function(Mobify,$ ) {
    var MObject = Mobify.MObject
      , serviceProperties = ["_M", "_callable", "_empties", "_setImportance", "_on",
            "_choice", "_outstanding", "_subMObjects"]
      , descend = function(root, fn, breadcrumbs) {
            breadcrumbs = breadcrumbs || '';
            var goInto = fn(root, breadcrumbs);
            if (!goInto || !goInto.length) return;

            $.each(goInto, function(i, key) {
                descend(root[key], fn, breadcrumbs + '.' + key);
            })
        };

    console.logMObjects = function() {
        var results = $.map(MObject.all, function(root) {
            if (root._subMObjects.length) return;

            var empties = [], choices = [];
            descend(root, function(current, parentCrumbs) {
                var goInto = [];
                $.each(current, function(key, value) {
                    if (key[0] == "_") return;
                    var breadcrumbs = parentCrumbs + '.' + key;

                    if (value instanceof MObject) {
                        goInto.push(key);
                        if (value._choice) choices.push([breadcrumbs, value]);
                    }
                    if (MObject.isEmpty(value)) empties.push([breadcrumbs, value]);
                });
                return goInto;
            });
            return {'root': root, 'empties': empties, 'choices': choices};
        });

        $.each(MObject.all, function(j, current) {
            $.each(serviceProperties, function(i, property) {
                delete current[property];
            });
        });

        $.map(results, function(result) {
            console.group('Whole object');
            console.log(result.root);
            console.groupEnd();  

            console.logGroup('warn', 'Unfilled values', result.empties);
            console.logGroup('log', 'Choices', result.choices);
        });
    };

    var timing = Mobify.timing;

    var override = function(name, fn) {
        fn.wrapped = MObject.prototype[name];
        MObject.prototype[name] = fn;
    };

    override('set', function set(key, value) {
        if (typeof key === "string") {
            timing.group('Set "' + key + '"');
            return set.wrapped.apply(this, arguments);
        } else {
            timing.lazyGroup('Set');
            var result = set.wrapped.apply(this, arguments);
            timing.groupEnd();
            return result;
        }
    });

    override('choose', function choose() {
        timing.lazyGroup('Choose');
        var result = choose.wrapped.apply(this, arguments);
        this._choice = true;
        timing.groupEnd();
        return result;
    });

    override('_record', function _record(key, value, importance) {
        if (importance === 0) {
            if (MObject.isEmpty(value)) {
                this._empties[key] = value;
            } else {
                delete this._empties[key];
            } 
        }
        
        debugger;
        timing.groupEnd();
        _record.wrapped.apply(this, arguments);
        if (value instanceof MObject) {

            value._subMObjects.push({parent: this, key: key});
        }
    });

})(Mobify, Mobify.$);