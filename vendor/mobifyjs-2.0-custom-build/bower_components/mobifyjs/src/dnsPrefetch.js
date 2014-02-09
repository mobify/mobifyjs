define(function() {
	// console.log('is this run?');
	return function(capture) {
		// TODO: write some TESTS.
		if (!capture) throw "DNS prefetch requires the captured document.";

		var frag = document.createDocumentFragment();

		// make sure prefetch control is on
		var prefetchCtl = document.createElement('meta');
		prefetchCtl.setAttribute('http-equiv','x-dns-prefetch-control');
		prefetchCtl.setAttribute('content', 'on');
		frag.appendChild(prefetchCtl);

		var els = capture.querySelectorAll('a[href],img[x-src],link[href],script[x-src]');
		var uniqNames = {};
		for (var i=0,ii=els.length;i<ii;i++) {
			var txt = els[i].href || els[i].getAttribute('x-src');
			var hn = (/(http(s)?:)?\/\/([-.\w]+)\//).exec(txt);
			if (hn && hn.length == 4) {
				uniqNames[hn[3]] = true;
			}
		}

		for (var hn in uniqNames) {
			var ln = document.createElement('link');
			ln.setAttribute('rel','dns-prefetch');
			ln.href = '//' + hn;
			frag.appendChild(ln);
		}
		var head = capture.head;
		if (head)  {
			var firstChild = head.firstChild;
			if (firstChild) {
				head.insertBefore(frag, firstChild);
			} else {
				head.appendChild(frag);
			}
		}
	}
}
);
