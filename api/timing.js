(function(Mobify) {

var timing = Mobify.timing = {
    points: []
  , addPoint: function(str, date) {
        var point = date || new Date;         
        this.points.push([point, str]);
    }
  , reset: function() {
        this.points = [];
    }
};

timing.addPoint('Wrote Mobify bootstrap tag', Mobify.points[0]);
timing.addPoint('Begun executing mobify.js file', Mobify.points[1]);
Mobify.points = [];

})(Mobify);