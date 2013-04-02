var capturing = window.Mobify && window.Mobify.capturing || false;
if (capturing) {
    // Initiate capture
    var capture = Mobify.Capture.init();

    // Grab reference to a newly created document
    var capturedDoc = capture.capturedDoc;

    Mobify.Unblockify.unblock();

    // Render source DOM to document
    capture.renderCapturedDoc();
}
