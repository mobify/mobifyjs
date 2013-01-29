define(["capture"], function(capture) {
	return function() {
		// TODO: We need a hook so this runs against the content of capture BEFORE it gets injected into the dom...

		var frag = document.createDocumentFragment();
		var createEl = document.createElement;

		// make sure prefetch control is on
		var prefetchCtl = createEl('meta');
		prefetchCtl.setAttribute('http-equiv','x-dns-prefetch-control');
		prefetchCtl.setAttribute('content', 'on');
		frag.appendChild(prefetchCtl);

		var els = document.querySelectorAll('a[href],img[src],link[href],script[src]');
		for (var i=0,ii=els.length;i<ii;i++) {
			var txt = els[i].href || els[i].src;
			var hn = (/(http(s)?:)?\/\/([-.\w]+)\//).exec(txt);
			if (hn && hn.length == 4) {
				var ln = createEl('link');
				ln.setAttribute('rel','dns-prefetch');
				ln.href = hn;
				frag.appendChild(ln);
			}
		}
		if (document.head) {
			document.head.append(frag);
		}
	}
}