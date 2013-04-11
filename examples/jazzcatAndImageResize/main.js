var capturing = window.Mobify && window.Mobify.capturing || false;
if (capturing) {
    // Initiate capture
    var capture = Mobify.Capture.init();

    // Grab reference to a newly created document
    var capturedDoc = capture.capturedDoc;

    // Resize images using Mobify Image Resizer
    var images = capturedDoc.querySelectorAll('img');
    Mobify.ResizeImages.resize( images, {
        projectName: "mobifytest"
    } );

    // Render source DOM to document

    var scripts = capturedDoc.querySelectorAll('script');
    Mobify.Jazzcat.combineScripts(scripts, {
        projectName: "mobifytest",
        storageSpace: "sampleframe.html",
        callback: function() {
            capture.renderCapturedDoc();
        }
    });    
    
}