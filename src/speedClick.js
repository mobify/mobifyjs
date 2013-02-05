define(function() {
	return function(){
		// wait until load event -- we want to catch elements that might be loaded via js
		// we may want to try and catch this as a 'tap' event (wait to see if the touch lasts more than 50ms)
		// lets see if it's too hair triggered and assess then.
		window.addEventListener('load', function(){
			var anchors = document.querySelectorAll('a[href]');
			for (var i=0,ii=anchors.length;i<ii;i++) {
				var a = anchors[i];
				if (! a.onclick) {
					a.addEventListener('touchstart', function(){
						var evt = document.createEvent("MouseEvents");
						evt.initMouseEvent("click", false, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
					    var cancelled = !a.dispatchEvent(evt);
					    // do we need to do anything if it was cancelled? 
					});
				}
			}
		});
	}
}
);