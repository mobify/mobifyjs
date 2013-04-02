require(["utils", "capture", "resizeImages", "jazzcat", "unblockify"], function(Utils, Capture, ResizeImages, Jazzcat, Unblockify) {
    Mobify.Utils = Utils;
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;
    Mobify.Jazzcat = Jazzcat;
    Mobify.Unblockify = Unblockify;
    Mobify.api = "2.0"; // v6 tag backwards compatibility change
    return Mobify

}, undefined, true);
// relPath, forceSync