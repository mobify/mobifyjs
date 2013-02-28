var capturing = window.capturing || false;
if (capturing) {
    console.log("Executing main during capturing phase!")

    // Grab reference to a newly created document
    var capture = Mobify.Capture.init();
    var capturedDoc = capture.capturedDoc;

    var newHtml = "<html><head>{style}<\/head><body><h1>Completely new document, grabs list of links from original document:<\/h1> {links} <\/body><\/html>";
    newHtml = newHtml.replace("{style}", capturedDoc.getElementsByTagName("link")[0].outerHTML);

    var links = "<ul>" + [].map.call(capturedDoc.getElementsByTagName("a"), 
                            function(el){ 
                                return "<li>" + el.href + "<\/li>"
                            }).join("") + "</li>";
    newHtml = newHtml.replace("{links}", links);

    newHtmlEscaped = Mobify.Capture.enable(newHtml, capture.prefix);

    capture.render(newHtmlEscaped)

} else {
    console.log("Executing main in post-capturing phase!");
}
