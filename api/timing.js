(function ($, Mobify) {
    var console = Mobify.console;

    var suffix = "ms ";
    function formatMillis(level, ms) {
        return paddings[level].slice(0, - suffix.length - ('' + ms).length) + ms + suffix;
    }

    var deltaLengths = [], paddings = [];
    var tryForMax = function(level, time) {
        deltaLengths[level] = Math.max(deltaLengths[level] || 0, (time + '').length);
    }

    var summarizeLengths = function() {
        for (var i = -1; i < deltaLengths.length; i++) {
            if (i > 0) deltaLengths[i] += deltaLengths[i-1] + suffix.length;
            paddings[i] = new Array(deltaLengths[i] + suffix.length + 1).join(' ');
        }
    }

    function diff(entry, i, collection) {
        var j = 0, level = entry[0], point = entry[1];
        tryForMax(-1, entry.timeFromStart = point - collection[0][1]);
        
        if (i) for (j = i - 1; j > 0; j = j - 1) {
            if (collection[j][0] <= level) break;
        }

        if (!entry[2]) entry[2] = 'Subtotal of ' + collection[j][2];
        tryForMax(level, entry.timeFromLast = point - collection[j][1]);
    };

    function format(entry) {
        return formatMillis(-1, entry.timeFromStart)
             + formatMillis(entry[0], entry.timeFromLast)
             + entry[2];
    }

    var timing = Mobify.timing = {
        points: []
      , level: 0
      , addPoint: function(str, date, level, groupStart) {
            var point = date || +new Date;         
            this.points.push([level || 0, point, str, groupStart]);
        }
      , group: function(str, date) {
            this.addPoint(str, date, ++this.level, 1);
        }
      , lazyGroup: function(str, date) {
            this.addPoint(str, date, ++this.level, -1);
        }        
      , groupEnd: function() {
            var last = this.points[this.points.length - 1];
            
            if (last[3]) {
                if (last[3] === 1) {
                    last[1] = +new Date;
                    delete last[3];
                } else this.points.pop();
            } else {
                this.addPoint('', +new Date, this.level);
            }
            --this.level;
        }
      , logPoints: function() {
            this.points.forEach(diff);
            summarizeLengths();
            var processed = this.points.map(format);

            console.logGroup('log', 'Timing', processed);
        }
      , reset: function() {
            this.points = [];
        }
    };

    timing.addPoint('Wrote Mobify bootstrap tag', Mobify.points[0]);
    timing.addPoint('Begun executing mobify.js file', Mobify.points[1]);
    Mobify.points = [];

})(Mobify.$, Mobify);