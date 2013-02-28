require(["capture", "resizeImages"], function(Capture, ResizeImages) {
    var Mobify = window.Mobify = window.Mobify || {};

    // === HACKS TO ENSURE NEW CODE WORKING WITH v6 TAG === //

    if (Mobify.api != "2.0.0") { // same as if (capturing)
        // legacy need for v6 tags
        Mobify.api = "2.0.0";

        // Remove the bootstrap and tag scripts
        var scripts = document.getElementsByTagName("script");
        var preview = scripts[1];
        preview.parentNode.removeChild(preview);
        var tag = scripts[1];
        tag.parentNode.removeChild(tag);

    // === END HACKS ====//

        // Grab reference to a newly created document
        var capture = new Capture();
        var capturedDoc = capture.capturedDoc;

        // Resize images using Mobify Image Resizer
        ResizeImages.resize(capturedDoc, 320);
        // Render source DOM to document
        capture.renderCapturedDoc();
    }

}, undefined, true);
// relPath, forceSync