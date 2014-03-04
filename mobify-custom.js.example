var Mobify = require('./src/mobify-library');

var capturing = window.Mobify && window.Mobify.capturing || false;
if (capturing) {
    // Grab reference to a newly created document
    Mobify.Capture.initCapture(function(capture){
        // optimize scripts
        var capturedDoc = capture.capturedDoc;
        //var scripts = capturedDoc.querySelectorAll('script');
        //Mobify.Jazzcat.optimizeScripts(scripts);
        // optimize images
        var images = capturedDoc.querySelectorAll('img, picture');
        Mobify.ResizeImages.resize(images);

        capture.renderCapturedDoc();
    });
} else {

}
