require(["capture", "resizeImages", "keepWarm", "dnsPrefetch", "speedClick", "jazzcat"], 
    function(Capture, ResizeImages, keepWarm, dnsPrefetch, speedClick, combineScripts) {
    
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;

    Mobify.dnsPrefetch = dnsPrefetch;
    Mobify.keepWarm = keepWarm;
    Mobify.speedClick = speedClick;
    Mobify.combineScripts = combineScripts;
    return Mobify

}, undefined, true);
// relPath, forceSync