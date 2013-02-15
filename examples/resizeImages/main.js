var capturing = window.capturing || false;
if (capturing) {
    console.log("Executing main during capturing phase!")

    // Grab reference to a newly created document
    var capture = new Mobify.Capture();
    var capturedDoc = capture.capturedDoc;

    // Resize images using Mobify Image Resizer
    Mobify.ResizeImages.resize(capturedDoc, 320);
    
    // Render source DOM to document
    capture.renderCapturedDoc();

} else {
    console.log("Executing main in post-capturing phase!");
    console.log(Mobify);
}