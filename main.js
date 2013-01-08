capturing = window.capturing;

if (capturing) {
    var $html = Mobify.Capture.getSourceDOM();

    //$html.find("script").remove();
    $html.find("img").resizeImages();

    //Mobify.Lazyload.rewriteSrc($html[0]);

    Mobify.Capture.renderSourceDOM();
} else {

    //Mobify.Lazyload.attachLazyloadEvents($html, true);

}