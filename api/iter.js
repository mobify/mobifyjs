define(["./mobifyjs"], function(Mobify) {
	var slice = [].slice;
	var isArray = Array.isArray || function(obj) {
 		return Object.prototype.toString.call(obj) == "[object Array]";
	};

	return Mobify.iter = {
	    extend: function(target){
	        slice.call(arguments, 1).forEach(function(source) {
	            for (key in source)
	                if (source[key] !== undefined)
	                    target[key] = source[key];
	        });
	        return target;
	    }

	  , keys: function(obj) {
	        var result = [];
	        for (var key in obj) {
	            if (obj.hasOwnProperty(key))
	                result.push(key);
	        }
	        return result;
	    }

	  , values: function(obj) {
	        var result = [];
	        for (var key in obj) {
	            if (obj.hasOwnProperty(key))
	                result.push(obj[key]);
	        }
	        return result;
	    }

	  , identity: function(x) {
	        return x;
	    }
	    
	  , isArray: function(arr) {
    		return (arr && arr.appendTo) || isArray(arr);
		}
	};
});