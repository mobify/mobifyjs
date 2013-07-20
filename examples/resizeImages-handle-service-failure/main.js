// main executable
var capturing = window.Mobify && window.Mobify.capturing || false;

if (capturing) {
    console.log("Executing main during capturing phase!")

    // Grab reference to a newly created document
    Mobify.Capture.init(function(capture){
        var capturedDoc = capture.capturedDoc;

        // Resize images using Mobify Image Resizer
        var images = capturedDoc.querySelectorAll('img');
        Mobify.ResizeImages.resize( images, {
            maxWidth: 320   
        });

        // Render source DOM to document
        capture.renderCapturedDoc();
    });
}
