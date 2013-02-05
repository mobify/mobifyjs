capturing = window.capturing;
if (capturing) {
    console.log("Executing main during capturing phase!")

    // Grab reference to a newly created document
    var captureDoc = Mobify.Capture.getCaptureDoc();

    console.log('dnsPrefetch');
    // console.log(Mobify.DnsPrefetch);
    Mobify.DnsPrefetch(captureDoc);
    console.log('speedclick');
    Mobify.SpeedClick();
    console.log('keepWarm');
    Mobify.KeepWarm();

    // Uncomment to remove all scripts in document
    //$html.find("script").remove();

    // Resize images using Mobify Image Resizer
    // $html.find("img").resizeImages(320);
    Mobify.ResizeImages.resize(captureDoc, 320);
    // Render source DOM to document
    Mobify.Capture.renderCaptureDoc({injectMain: true});

} else {
    console.log("Executing main in post-capturing phase!");
}
