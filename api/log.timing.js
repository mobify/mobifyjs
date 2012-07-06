(function(Mobify, $) {

    var indent
      , totalIndent
      , suffix = "ms "
      , whitespace = new Array(666).join(' ')
      , indent = []
      , totalIndent = []

      , padMillis = function(level, str) {
            return (whitespace + str).slice(-totalIndent[level]);
        }

      , updateMaximumLength = function(level, str) {
            indent[level] = Math.max(indent[level] || 0, str.length);
        };

    $.extend(Mobify.timing, {
        level: 0
      , addPoint: function(str, date, level, groupStart) {
            var date = date || new Date;
            var entry = [date, str];
            $.extend(entry, {
                'date': date
              , 'str': str
              , 'level': level || 0
              , 'groupStart' : groupStart
            });
            this.points.push(entry);
        }  
      , group: function(str, date) {
            this.addPoint(str, date, ++this.level, 1);
        }
      , lazyGroup: function(str, date) {
            this.addPoint(str, date, ++this.level, -1);
        }        
      , groupEnd: function() {
            var last = this.points[this.points.length - 1];
            
            if (last.groupStart) { // Collapse childless group
                if (last.groupStart === 1) {
                    last.point = new Date;
                    delete last.groupStart;
                } else this.points.pop();
            } else {
                this.addPoint('', new Date, this.level);
            }
            --this.level;
        }
    });
    var timing = Mobify.timing
      , oldPoints = Mobify.timing.points;

    timing.reset();
    oldPoints.forEach(function(entry) {
        timing.addPoint.call(timing, entry[1], entry[0]);
    });

    console.logTiming = function() {
        indent = [];
        totalIndent = [];

        Mobify.timing.points.forEach(function (entry, i, points) {
            var j = 0;

            entry.timeFromStart = (entry.date - points[0].date) + suffix;
            updateMaximumLength(-1, entry.timeFromStart);
            
            if (i) for (j = i - 1; j > 0; j = j - 1) {
                if (points[j].level <= entry.level) break;
            }

            if (!entry.str) entry.str = 'Subtotal of ' + points[j].str;
            entry.timeFromPrev = (entry.date - points[j].date) + suffix;
            updateMaximumLength(entry.level, entry.timeFromPrev);
        });

        for (var i = 0; i < indent.length; i++) {
            totalIndent[i] = indent[i] + (totalIndent[i-1] || 0);
        }
        totalIndent[-1] = indent[-1];

        var indentedTiming = Mobify.timing.points.map(function(entry) {
            return padMillis(-1, entry.timeFromStart)
                 + padMillis(entry.level, entry.timeFromPrev)
                 + entry.str;
        });

        console.logGroup('log', 'Timing', indentedTiming);
    }
})(Mobify, Mobify.$);