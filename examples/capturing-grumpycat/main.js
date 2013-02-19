var capturing = window.capturing || false;
if (capturing) {
    console.log("Executing main during capturing phase!")

    // Grab reference to a newly created document
    var capture = Mobify.Capture.init();
    var capturedDoc = capture.capturedDoc;

    var grumpyUrl = "/examples/assets/images/grumpycat.jpg"

    var imgs = capturedDoc.getElementsByTagName("img");
    for(var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        var ogImage = img.getAttribute("x-src");
        img.setAttribute("x-src", grumpyUrl);
        img.setAttribute("old-src", ogImage);
    }
    
    // Render source DOM to document
    capture.renderCapturedDoc();

} else {
    console.log("Executing main in post-capturing phase!");
}
