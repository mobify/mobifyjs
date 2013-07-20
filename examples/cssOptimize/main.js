// main executable
var capturing = window.Mobify && window.Mobify.capturing || false;

if (capturing) {
    console.log("Executing main during capturing phase!");

    // Grab reference to a newly created document
    Mobify.Capture.init(function(capture){
        var capturedDoc = capture.capturedDoc;

        // Optimize stylesheets using CSS Optimizer
        var styleSheets = capturedDoc.querySelectorAll('link[rel="stylesheet"]');
        // Mobify.CssOptimize.optimize(styleSheets, {protoAndHost: '//jazzcat-next.herokuapp.com'});
        Mobify.CssOptimize.optimize(styleSheets);

        // Render source DOM to document
        capture.renderCapturedDoc();
    });
}