capturing = window.capturing;
if (capturing) {
    console.log("Executing main during capturing phase!")

    // Grab reference to a newly created document
    var sourceDoc = Mobify.Capture.getSourceDoc();

    // Uncomment to remove all scripts in document
    //$html.find("script").remove();

    // Resize images using Mobify Image Resizer
    // $html.find("img").resizeImages(320);
    Mobify.ResizeImages.resize(sourceDoc, 320)

    // Render source DOM to document
    Mobify.Capture.renderSourceDoc({injectMain: true});

} else {
    console.log("Executing main in post-capturing phase!");
}
