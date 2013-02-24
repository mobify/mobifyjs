var capturing = window.capturing || false;

function modifyDom(elements, prefix) {
    for (var i=0; i<elements.length; i++) {
        var el = elements[i];
        var mediaQuery = el.getAttribute("media");
        var match = window.matchMedia(mediaQuery).matches;
        var src = (prefix || "") + "src";
        if (el.tagName === "IMG") {
            if (match) {
                var set = src, unset = "unset-src";
            } else {
                var set = "unset-src", unset = src;
            }
            if (el.hasAttribute(unset)) {
                el.setAttribute(set, el.getAttribute(unset));
                el.removeAttribute(unset);
            }
        }
        if (!match) {
            el.style.display = 'none';
        }
        else if (match) {
            el.style.display = 'block';
        }

    }

}

if (capturing) {
    console.log("Executing main during capturing phase!")

    // Grab reference to a newly created document
    var capture = Mobify.Capture.init();
    var capturedDoc = capture.capturedDoc;

    // Grab all element with the media attribute and remove them if their media
    // query does not match
    var mediaElements = capturedDoc.querySelectorAll("[media]");
    modifyDom(mediaElements, capture.prefix);
    
    // Render source DOM to document
    capture.renderCapturedDoc();

} else {
    console.log("Executing main in post-capturing phase!");
    var mediaElements = document.querySelectorAll("[media]");
    window.onresize = function() {
        modifyDom(mediaElements);            
    }
}
