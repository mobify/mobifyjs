require(["./utils.js", "./capture.js", "./resizeImages.js", "./keepWarm.js", "./dnsPrefetch.js", "./speedClick.js", "./jazzcat.js"], 
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
