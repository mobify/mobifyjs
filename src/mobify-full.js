require(["capture", "resizeImages"], function(Capture, ResizeImages) {
    var Mobify = window.Mobify = window.Mobify || {};
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;
    //Mobify.Enhance = Enhance;

    return Mobify

}, undefined, true);
// relPath, forceSync