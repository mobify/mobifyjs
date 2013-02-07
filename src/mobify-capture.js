require(["capture"], function(Capture) {
	console.log('suuppppp');
    var Mobify = window.Mobify = window.Mobify || {};
    Mobify.Capture = Capture;
    Mobify.api = 2.0; // Required for legacy purposes
    return Mobify

}, undefined, true);
// relPath, forceSync