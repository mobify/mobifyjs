/*! 
 * mobify.js
 * http://www.mobify.com/
 *
 * Copyright (c) Mobify R&D Inc.
 * Full license available at http://portal.mobify.com/license/
 */
(function(Mobify) {
    Mobify.restoreMethods && Mobify.restoreMethods();

    // Comptability.

    // V6 needs this to think things have loaded.
    Mobify.api = true;

    // V6 comptability. Copy properties to `Mobify.config`.
    var config = Mobify.config = Mobify.config || {};
    if (Mobify.tagVersion) {
        config.tagVersion = Mobify.tagVersion.join('.');
    }

    if (typeof config.tagVersion === 'string') {
        config.tagVersion = parseInt(config.tagVersion)
    }

    // V3 tags didn't have `Mobify.points`.
    if (!Mobify.points) {
        Mobify.points = [+new Date, +new Date]
    }

    function formatMillis(ms) {
        return ('        ' + (+ms) + 'ms ').slice(-10);
    }

    function formatEntry(entry, i, collection) {
        var point = entry[0];
        var name = entry[1];
        var timeFromStart = formatMillis(point - collection[0][0]);
        var timeFromLast  = formatMillis(point - (collection[i-1] || collection[0])[0]);

        return timeFromStart + timeFromLast + name;
    }

    // TODO: Break start out into it's own parameters - bandwidth etc. is unreleated to our load time.
    Mobify.timing = {
        points: [],
        selectors: [],

        addPoint: function(str, date) {
            var point = date || +new Date;         
            this.points.push([point, str]);
            return point;
        },

        addSelector: function(str, date) {
            var point = date || +new Date;         
            this.selectors.push([point, str]);
        },

        logGroup: function(group, name) {
            var processed = Mobify._.map(group, formatEntry);   

            console.groupCollapsed
                ? console.groupCollapsed(name)
                : console.group(name);

            if (console.dir) {
                console.dir(processed);
            } else {
                Mobify._.each(processed, function(x) {
                    console.log(x);
                });
            }
            console.groupEnd();
        },

        logPoints: function() {
            this.logGroup(this.points, 'Global timing');
            this.logGroup(this.selectors, 'Data evaluation timing');

            this.points = [];
            this.selectors = [];
        }
    };

    Mobify.timing.addPoint('Finished Document', Mobify.points[1]);
    Mobify.timing.addPoint('Loaded Mobify.js');

})(Mobify);