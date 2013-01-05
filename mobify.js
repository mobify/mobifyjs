debugger;

define(["Zepto", "capture", "image-lazyloading"], function($, Capture, Lazyload) {
    debugger;

    if (capturing) {
        var $html = Capture.getSourceDOM();

        $html.find("script").remove();

        // Poor mans Ark :)
        //var injectScript = "<script id=\"mobify-injected\">";
        //injectScript += "\n\ndocument.addEventListener(\"DOMContentLoaded\", function() { console.log(\"hello!\") }, false );"
        //injectScript += "</script>";
        //$html.find("body").append(injectScript);

        Lazyload.rewriteSrc($html[0]);

        Capture.renderSourceDOM();
    }

    Lazyload.processScroll();
});