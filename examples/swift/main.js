var capturing = window.capturing || false;
if (capturing) {
    console.log("test")


    // Remove the bootstrap and tag scripts
    //var scripts = document.getElementsByTagName("script");
    // debugger;
    // console.log(scripts);
    // var preview = scripts[1];
    // preview.parentNode.removeChild(preview);
    //var tag = scripts[1];
    //tag.parentNode.removeChild(tag);

    // Mobify.dnsPrefetch = dnsPrefetch;
    // Mobify.keepWarm = keepWarm;
    // Mobify.speedClick = speedClick;


    // Grab reference to a newly created document

    var capture = new Mobify.Capture();
    var capturedDoc = capture.capturedDoc;

    var scripts = capturedDoc.querySelectorAll('script.grabMe');
    var jcResult = Mobify.Jazzcat.combineScripts(scripts);
    for (var i=0,ii=jcResult.length;i<ii;i++) {
        capturedDoc.body.appendChild(jcResult[i]);
    }

    Mobify.dnsPrefetch(capturedDoc);
    Mobify.keepWarm();

    // Resize images using Mobify Image Resizer
    Mobify.ResizeImages.resize( capturedDoc.querySelectorAll("img"), 
                                { 
                                  projectName: "mobifycom",
                                  maxWidth: 320 
                                });
    
    // Render source DOM to document
    capture.renderCapturedDoc();
}