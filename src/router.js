/**
 * Router - a simple module for doing routing for adapative tempalting in 
 * Mobify.js
 */

define(["utils", "urlmatch"], function(Utils, urlmatch) {

/**
 * Takes a value, returns its "truthiness". A value is "falsey" if it "ifs" 
 * false, or it ifs true but has a length property of 0 (eg emoty array-like 
 * things).
 */
var truthy = Router._truthy = function(val) {
	if(val) {
		if (val.length !== undefined && val.length === 0) {
			return false;
		}
		return true;
	}
	return false;
};

var Router = function(options) {
	if(!(this instanceof Router)) {
		return new Router(options);
	}
	Utils.extend(this, options);
	this.routes = [];
};

Router.prototype.add = function(match, result) {
	this.routes.push({
		match: match,
		result: result
	});
};

Router.prototype.match = function() {
	var match;
	for(var i = 0, len = this.routes.length; i < len; i++) {
		var route = this.routes[i];
		// execute the route's match function, skipping over errors
		try {
			match = route.match();
		} catch (e) {
			console.error(e);
			continue;
		}

		if(Router._truthy(match)) {
			return {
				match: match,
				result: route[i].result
			};
		}
	}
	return null;
};

// mockable "private" reference to document
Router._document = window.document;

/**
 * Takes a selector `sel` and returns a function that will search for elements 
 * matching that selector in the doucment.
 */

Router.selector = function(sel) {
	return function() {
		return Router._document.querySelectorAll(sel);
	};
};

/**
 * Takes `pattern`, an url pattern or a regular expresison and returns a 
 * function that will return true if the window's location matches the pattern.
 */
Router.urlmatch = function(pattern) {
	return urlmatch(pattern);
};

return Router;
});