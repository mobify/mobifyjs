var capturing = window.capturing || false;
if (capturing) {
    console.log("test")

    var scripts = document.querySelectorAll('script.jazzcatTest');
    var jcResult = Mobify.combineScripts(scripts);

    // Remove the bootstrap and tag scripts
    //var scripts = document.getElementsByTagName("script");
    // debugger;
    // console.log(scripts);
    // var preview = scripts[1];
    // preview.parentNode.removeChild(preview);
    //var tag = scripts[1];
    //tag.parentNode.removeChild(tag);

    Mobify.dnsPrefetch = dnsPrefetch;
    Mobify.keepWarm = keepWarm;
    Mobify.speedClick = speedClick;

    // Grab reference to a newly created document
    var capture = new Capture();
    var capturedDoc = capture.capturedDoc;

    Mobify.dnsPrefetch(capturedDoc);
    Mobify.keepWarm();

    // Resize images using Mobify Image Resizer
    ResizeImages.resize(capturedDoc, 320);
    // Render source DOM to document
    capture.renderCapturedDoc();
}