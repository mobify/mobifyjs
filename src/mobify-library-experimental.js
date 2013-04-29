require(["utils", "capture", "resizeImages", "keepWarm", "dnsPrefetch", "speedClick", "jazzcat"], 
    function(Utils, Capture, ResizeImages, keepWarm, dnsPrefetch, speedClick, Jazzcat) {
    
    Mobify.Utils = Utils;
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;

    Mobify.dnsPrefetch = dnsPrefetch;
    Mobify.keepWarm = keepWarm;
    Mobify.speedClick = speedClick;
    Mobify.Jazzcat = Jazzcat;
    return Mobify

}, undefined, true);
// relPath, forceSync