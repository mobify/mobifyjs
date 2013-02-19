var capturing = window.capturing || false;
if (capturing) {
    console.log("Executing main during capturing phase!")

    // Grab reference to a newly created document
    var capture = Mobify.Capture.init();
    var capturedDoc = capture.capturedDoc;

    var grumpyUrl = "http://pics.blameitonthevoices.com/092012/small_grumpy%20cat%20caption.jpg";

    var imgs = capturedDoc.getElementsByTagName("img");
    for(var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        img.setAttribute("x-src", grumpyUrl);
    }
    var p = capturedDoc.createElement("p");
    p.innerHTML = "The original images were swapped out for a couple of grumpy cats. ";
    p.innerHTML += "Open your web inspector and note the original imgs did not load. ";
    p.innerHTML += "Also note, they were plain old img elements (no x&ndash;src tricks).";
    capturedDoc.getElementsByTagName("body")[0].appendChild(p);
    
    
    // Render source DOM to document
    capture.renderCapturedDoc();

} else {
    console.log("Executing main in post-capturing phase!");
    console.log(Mobify);
}
