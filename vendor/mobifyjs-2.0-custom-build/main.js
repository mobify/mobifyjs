require(["mobifyjs/utils", "mobifyjs/resizeImages", "mobifyjs/jazzcat", "mobifyjs/cssOptimize"], function(Utils, ResizeImages, Jazzcat, CssOptimize) {
    var Mobify = window.Mobify = window.Mobify || {};

    // Expose APIs we want to use from Mobify.js
    Mobify.Utils = Utils;
    Mobify.ResizeImages = ResizeImages;
    Mobify.Jazzcat = Jazzcat;
    Mobify.CssOptimize = CssOptimize;

}, undefined, true);
// relPath, forceSync
