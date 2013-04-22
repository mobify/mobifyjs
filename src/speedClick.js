define(function() {
	return function(domElement){
		if (!domElement) domElement = document;
		var touchTarget;
		var speedTargets = {'A': true,
							'INPUT': true,
							'BUTTON': true,
							'SELECT': true
						}
		domElement.addEventListener('touchstart', function(e) {
			touchTarget = e.target;
		});

		domElement.addEventListener('touchend', function(e){
			var target = e.target;
			if (target != touchTarget) {
				return;	
			} 
			if (target.tagName in speedTargets) {
				var evt = document.createEvent("MouseEvents");
				evt.initMouseEvent("click", false, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
			    var cancelled = !target.dispatchEvent(evt);
			    // do we need to do anything if it was cancelled? 
			}
		});

		domElement.addEventListener('touchmove', function(e) {
			touchTarget = false;
		});
	}
});