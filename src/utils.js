define([], function() {

// ##
// # Utility methods
// ##

var Utils = {};

var extend = Utils.extend = function(target){
    [].slice.call(arguments, 1).forEach(function(source) {
      for (key in source)
          if (source[key] !== undefined)
              target[key] = source[key];
    }); 
    return target;
};

var keys = Utils.keys = function(obj) {
    var result = []; 
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
          result.push(key);
    }   
    return result;
};  

var values = Utils.values = function(obj) {
    var result = []; 
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
          result.push(obj[key]);
    }   
    return result;
};

return Utils;

});