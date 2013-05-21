var capturing = window.Mobify && window.Mobify.capturing || false;
if (capturing) {
    // Initiate capture
    Mobify.Capture.init(function(capture){

        // Grab reference to a newly created document
        var capturedDoc = capture.capturedDoc;

        var scripts = capturedDoc.querySelectorAll('script');
        Mobify.Jazzcat.combineScripts(scripts, capturedDoc);

        // Resize images using Mobify Image Resizer
        var images = capturedDoc.querySelectorAll('img');
        Mobify.ResizeImages.resize( images );

        // Render source DOM to document
        capture.renderCapturedDoc();
    });
}