define(function() {
	return function(keepWarmFor){
		// No mechanism to cancel by design: keepWarmFor should be set to a reasonably small
		// interval
		if (!keepWarmFor) keepWarmFor=2*60*1000; // default: 2 minutes
		var intervalId=setInterval(function(){
			var img = document.createElement('img');
			// img.style.cssText = 'display: none';
			// 1x1 is a tiny file which will only cache for 1 second.
			img.src = '//cdn.mobify.com/1x1.gif';
			// Typical 3G 5 second tail time to half power
			// Additional 12 seconds to radio idle
			// 1x1.gif has a max-age of 1 second, will generate 304s subsequently
			// enough to keep radio at half-power.  Let's see how 10s works
		}, 4500);
	}
	}
);