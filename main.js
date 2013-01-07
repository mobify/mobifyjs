capturing = window.capturing || false;

if (capturing) {
    var $html = Mobify.Capture.getSourceDOM();

    //$html.find("script").remove();

    // Poor mans Ark :)
    //var injectScript = "<script id=\"mobify-injected\">";
    //injectScript += "\n\ndocument.addEventListener(\"DOMContentLoaded\", function() { console.log(\"hello!\") }, false );"
    //injectScript += "</script>";
    //$html.find("body").append(injectScript);

    Mobify.Lazyload.rewriteSrc($html[0]);
    Mobify.Lazyload.attachLazyloadEvents($html, true);

    Capture.renderSourceDOM();
}