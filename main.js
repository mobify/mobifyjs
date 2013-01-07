require.config({
    "paths": {   
        "Zepto": "vendor/zepto"
    },
    "shim": {
        "Zepto": {"exports": "$"}
    },
    baseUrl: "http://localhost:3000",
    waitSeconds: 15,
});

require(["Zepto", "capture", "image-lazyloading"], function($, Capture, Lazyload) {

    window.Mobify = {};
    window.Mobify.$ = $;
    
    capturing = window.capturing || false;

    if (capturing) {
        var $html = Capture.getSourceDOM();

        //$html.find("script").remove();

        // Poor mans Ark :)
        //var injectScript = "<script id=\"mobify-injected\">";
        //injectScript += "\n\ndocument.addEventListener(\"DOMContentLoaded\", function() { console.log(\"hello!\") }, false );"
        //injectScript += "</script>";
        //$html.find("body").append(injectScript);

        Lazyload.rewriteSrc($html[0]);
        Lazyload.attachLazyloadEvents($html, true);

        Capture.renderSourceDOM();
    }

});