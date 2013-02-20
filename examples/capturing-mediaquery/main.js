var capturing = window.capturing || false;
if (capturing) {
    console.log("Executing main during capturing phase!")

    // Grab reference to a newly created document
    var capture = Mobify.Capture.init();
    var capturedDoc = capture.capturedDoc;

    // Grab all element with the media attribute and remove them if their media
    // query does not match
    var mediaElements = capturedDoc.querySelectorAll("[media]");
    for (var i=0; i<mediaElements.length; i++) {
        var el = mediaElements[i];
        var mediaQuery = el.getAttribute("media");
        if (mediaQuery != "mobify-media" && !window.matchMedia(mediaQuery).matches){
            el.parentNode.removeChild(el);
        }
    }
    
    // Render source DOM to document
    capture.renderCapturedDoc();

} else {
    console.log("Executing main in post-capturing phase!");
    console.log(Mobify);
}
