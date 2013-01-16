capturing = window.capturing;
if (capturing) {
    console.log("Executing main during capturing phase!")

    // Grab Zepto reference to escaped source DOM object
    var $html = Mobify.Capture.getSourceDOM();

    // Uncomment to remove all scripts in document
    //$html.find("script").remove();

    // Resize images using Mobify Image Resizer
    $html.find("img").resizeImages(320);

    // Render source DOM to document
    Mobify.Capture.renderSourceDOM({injectMain: true});

} else {
    console.log("Executing main in post-capturing phase!");
}
