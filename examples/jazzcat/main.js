var capturing = window.Mobify && window.Mobify.capturing || false;
if (capturing) {
    // Initiate capture
    Mobify.Capture.init(function(capture){

        // Grab reference to a newly created document
        var capturedDoc = capture.capturedDoc;

        // Grab all scripts to be concatenated into one request
        var scripts = capturedDoc.querySelectorAll('script');
        Mobify.Jazzcat.combineScripts(scripts, capturedDoc);

        // Render source DOM to document
        capture.renderCapturedDoc();
    });
}