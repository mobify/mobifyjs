require(["utils", "capture", "resizeImages", "jazzcat", "unblockify",
        "cssOptimize", "timing", "external/picturefill"], 
        function(Utils, Capture, ResizeImages, Jazzcat, Unblockify,
                 CssOptimize, Timing) {
    var Mobify = window.Mobify = window.Mobify || {};
    Mobify.Utils = Utils;
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;
    Mobify.Jazzcat = Jazzcat;
    Mobify.CssOptimize = CssOptimize;
    Mobify.Unblockify = Unblockify;
    Mobify.Timing = Timing;
    Mobify.api = "2.0"; // v6 tag backwards compatibility change
    return Mobify;

}, undefined, true);
// relPath, forceSync