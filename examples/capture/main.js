capturing = window.capturing;
if (capturing) {
    console.log("Executing main during capturing phase!")
    var $html = Mobify.Capture.getSourceDOM();

    //$html.find("script").remove();
    //$html.find("img").resizeImages();

    //Mobify.Lazyload.rewriteSrc($html[0]);

    Mobify.Capture.renderSourceDOM({injectMain: false});

} else {
    console.log("Executing main in post-capturing phase!");
    //Mobify.Lazyload.attachLazyloadEvents($html, true);

}
