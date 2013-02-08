var capturing = window.capturing || false;
if (capturing) {
    console.log("Executing main during capturing phase!")

    // Grab reference to a newly created document
    var capture = new Mobify.Capture();
    var capturedDoc = capture.doc;

    // Uncomment to remove all scripts in document
    //$html.find("script").remove();

    // Resize images using Mobify Image Resizer
    // $html.find("img").resizeImages(320);
    Mobify.ResizeImages.resize(capturedDoc, 320);
    // Render source DOM to document
    capture.renderCapturedDoc({injectMain: true});

} else {
    console.log("Executing main in post-capturing phase!");
    console.log(Mobify);
}
