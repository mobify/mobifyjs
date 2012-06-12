(function(Mobify,$ ) {
    var console = Mobify.console
      , MObject = Mobify.MObject
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

    MObject.log = function() {
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
    }
})(Mobify, Mobify.$);