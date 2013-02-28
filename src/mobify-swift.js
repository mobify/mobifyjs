require(["capture", "resizeImages", "keepWarm", "dnsPrefetch", "speedClick", "jazzcat"], 
    function(Capture, ResizeImages, keepWarm, dnsPrefetch, speedClick, Jazzcat) {
    
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;

    Mobify.dnsPrefetch = dnsPrefetch;
    Mobify.keepWarm = keepWarm;
    Mobify.speedClick = speedClick;
    Mobify.Jazzcat = Jazzcat;
    return Mobify

}, undefined, true);
// relPath, forceSync