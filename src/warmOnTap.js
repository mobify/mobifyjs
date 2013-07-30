// Warm the radio up when a touchstart begins on certain types of elements that are likely to cause a navigation
// or ajax request in the immediate future. 

// Developer can pass an optional parameter specifying selector match for elements to trigger on
// Defaults to some common targets.

define(["./warmOnTap.js"], function(warmOnTap) {
	return function(selector){
		var defaultSelector = ['A', 'INPUT', 'BUTTON', 'SELECT'];
		if (!selector) selector = defaultSelector;
		var funcNames = ['match', 'webkitMatchesSelector', 'mozMatchesSelector', 'matchesSelector', 'matches'];
		var matchFunc = 'match'; 
		for (var i=0,ii=funcNames.length;i<ii;i++) {
			
		}

		document.addEventListener('touchstart', function(e) {
			var target = e.target;		

			if (target.tagName in speedTargets) {
				warmOnDemand();
			}
		});
	}
});
