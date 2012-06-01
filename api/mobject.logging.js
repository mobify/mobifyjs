(function(Mobify,$ ) {
    var MObject = Mobify.mobject.MObject;
    var console = Mobify.console;

    var descend = function(root, fn, breadcrumbs) {
        breadcrumbs = breadcrumbs || '';
        var goInto = fn(root, breadcrumbs);
        if (!goInto || !goInto.length) return;

        $.each(goInto, function(i, key) {
            descend(root[key], fn, breadcrumbs + '.' + key);
        })
    };

    var extraProperties = ["_M", "_callable", "_empties", "_nextSet", "_on", "_choice", "_outstanding", "_refs"];
    Mobify.mobject.log = function() {
        var results = $.map(Mobify.mobject.allMObjects, function(root) {
            if (root._refs.length) return;

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

        $.each(Mobify.mobject.allMObjects, function(j, current) {
            for (var i = 0, l = extraProperties.length; i < l; ++i) {
                delete current[extraProperties[i]];
            }
        });

        $.map(results, function(result) {
            console.group('Whole object');
            console.log(result.root);
            console.groupEnd();  

            console.logGroup('warn', 'Unfilled values', result.empties);
            console.logGroup('log', 'Choices', result.choices);
        });
    }
})(Mobify, Mobify.$);