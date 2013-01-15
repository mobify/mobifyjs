require.config({
    "paths": {   
        "Mobify": "http://cloud.dev:8000/static/mobifyjs/mobify"
    },
    shim: {
        "Mobify": {
            exports: "Mobify"
        }
    },
    baseUrl: "http://localhost:3000/framework/",
    waitSeconds: 15, 
});

require(["Mobify", "mustache",], function(Mobify, mustache) {

    console.log("Executing main during capturing phase!")
    var $html = Mobify.Capture.getSourceDOM();

    //$html.find("script").remove();
    $html.find("img").resizeImages();

    //Mobify.Lazyload.rewriteSrc($html[0]);


    function contextFilter(context) {
        newContext = {};

        for (key in context) {
            value = context[key];
            type = Object.prototype.toString.call(value);

            if (type == '[object Array]') {
                // Grab outerHTML string of all nodes in collection
                newContext[key] = $.map(value, function(node){
                    return node.outerHTML || contextFilter(node);
                });
            } 
            else if (type == '[object Function]') {
                var newValue = value();
                var newType = Object.prototype.toString.call(value);

                if (type == '[object Array]') {
                    newContext[key] = $.map(newValue, function(node){
                        return node.outerHTML || contextFilter(node);
                    });
                } else {
                    newContext[key] = newValue;
                }
            } 
            else if (value === Object(value)) {
                newContext[key] = contextFilter(value);
            } 
            else {
                newContext[key] = value;
            }
        }
        return newContext;
    }

    var context = {
        "title": function() {
            return $html.find("title").text();
        },
        "anchors": function() {
            return $html.find("a");
        },
    }

    var html = "<html><head><title>{{title}}</title></head><body><h1>All links from TSN:</h1>{{#anchors}}<p><b>{{.}}</b></p>{{/anchors}}</body></html>";
    Mobify.Capture.render(mustache.to_html(html, contextFilter(context)));

});

