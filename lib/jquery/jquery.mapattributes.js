/*!
 * mapAttributes jQuery Plugin v1.0.0
 *
 * Copyright 2010, Michael Riddle
 * Licensed under the MIT
 * http://jquery.org/license
 *
 * Date: Sun Mar 28 05:49:39 2010 -0900
 */
(function($) {
	$.fn.mapAttributes = function(prefix) {
		var maps = [];
		$(this).each(function() {
			var map = {};
			for(var key in this.attributes) {
				if(!isNaN(key)) {
					if(!prefix || this.attributes[key].name.substr(0,prefix.length) == prefix) {
						map[this.attributes[key].name] = this.attributes[key].value;
					}
				}
			}
			maps.push(map);
		});
		if (maps.length == 0) {
			return {};
		}
		return (maps.length > 1 ? maps : maps[0]);
	}
})(Mobify.$);