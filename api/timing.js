/*! 
 * mobify.js
 * http://www.mobify.com/
 *
 * Copyright (c) Mobify R&D Inc.
 * Full license available at http://portal.mobify.com/license/
 */
(function (Mobify) {

var console = Mobify.console
  , $ = Mobify.$

  , formatMillis = function(ms) {
        return ('        ' + (+ms) + 'ms ').slice(-10);
    }

  , formatEntry = function(entry, i, collection) {
        var point = entry[0]
          , name = entry[1]
          , timeFromStart = formatMillis(point - collection[0][0])
          , timeFromLast  = formatMillis(point - (collection[i-1] || collection[0])[0])

        return timeFromStart + timeFromLast + name;
    }
    
  , timing = Mobify.timing = {
        points: []
      , selectors: []

      , addPoint: function(str, date) {
            var point = date || +new Date;
            this.points.push([point, str]);
            return point;
        }

      , addSelector: function(str, date) {
            var point = date || +new Date;
            this.selectors.push([point, str]);
        }

      , logGroup: function(group, name) {
            var processed = group.map(formatEntry);

            console.groupCollapsed
                ? console.groupCollapsed(name)
                : console.group(name);

            if (console.dir) {
                console.dir(processed);
            } else {
                $.each(processed, function(i, x) {
                    console.log(x);
                });
            }
            console.groupEnd();
        }

      , logPoints: function() {
            this.logGroup(this.points, 'Global timing');
            this.logGroup(this.selectors, 'Data evaluation timing');
        }

        // Allow plugins to reset timing for their own use.
      , reset: function() {
            this.points = [];
            this.selectors = [];
        }
    };

timing.addPoint('Finished Document', Mobify.points[1]);
timing.addPoint('Loaded Mobify.js');

})(Mobify);