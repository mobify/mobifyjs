/**
 * An API to record timing for Mobify.js 2.0
 */
define([], function() {
    var timings = [];

    /**
     * Takes an event `name`, and an optional date, which will default to now 
     * when unspecified, and records them.
     */
    var record = function(name, date) {
        timings.push([name, date || Date.now()]);
    };

    var sort = function() {
        var comparator = function(a, b) {
            return a[1] < b[1] ? -1 : 1;
        };
        timings.sort(comparator);
    };

    // slurp up timing point left by the tag
    window.Mobify && window.Mobify.points && window.Mobify.points[0] &&
    record("start", window.Mobify.points[0]);

    return {
        record: record,
        sort: sort,
        timings: timings
    };
});