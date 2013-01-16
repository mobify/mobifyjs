require(["capture", "resizeImages", "enhance"], function(Capture, ResizeImages, Enhance) {
    var Mobify = window.Mobify = window.Mobify || {};
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;
    Mobify.Enhance = Enhance;

    return Mobify

}, undefined, true);
// relPath, forceSync