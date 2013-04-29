var capturing = window.Mobify && window.Mobify.capturing || false;

if (capturing) {
    console.log("Executing main during capturing phase!")

    // Grab reference to a newly created document
    Mobify.Capture.init(function(capture){

        var capturedDoc = capture.capturedDoc;
        
        // Render source DOM to document
        capture.renderCapturedDoc();
    });

} else {
    console.log("Executing main in post-capturing phase!");
}