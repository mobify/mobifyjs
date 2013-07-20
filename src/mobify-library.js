require(["mobifyjs/utils", "mobifyjs/capture", "mobifyjs/resizeImages", "mobifyjs/jazzcat", "mobifyjs/unblockify", "mobifyjs/cssOptimize", "mobifyjs/external/picturefill"], function(Utils, Capture, ResizeImages, Jazzcat, Unblockify, cssOptimize) {
    var Mobify = window.Mobify = window.Mobify || {};
    Mobify.Utils = Utils;
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;
    Mobify.Jazzcat = Jazzcat;
    Mobify.CssOptimize = CssOptimize;
    Mobify.Unblockify = Unblockify;
    Mobify.api = "2.0"; // v6 tag backwards compatibility change
    return Mobify;

}, undefined, true);
// relPath, forceSync
