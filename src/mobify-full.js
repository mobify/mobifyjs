require(["capture", "resizeImages"], function(Capture, ResizeImages) {
    var Mobify = window.Mobify = window.Mobify || {};
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;
    //Mobify.Enhance = Enhance;
    Mobify.api = 2.0
    return Mobify

}, undefined, true);
// relPath, forceSync