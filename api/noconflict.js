if ($.noConflict) {
	Mobify.$ = $.noConflict(true)
} else {
	Mobify.$ = window.Zepto;
	Mobify.$.support = Mobify.$.support || {};
	if (Zepto === $) delete window.$;
	delete window.Zepto;
}