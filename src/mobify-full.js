require(["utils", "capture", "resizeImages", "jazzcat"], function(Utils, Capture, ResizeImages, Jazzcat) {
    Mobify.Utils = Utils;
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;
    Mobify.Jazzcat = Jazzcat;
    Mobify.api = "2.0"; // v6 tag backwards compatibility change
    return Mobify

}, undefined, true);
// relPath, forceSync