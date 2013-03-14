var capturing = window.capturing || false;
if (capturing) {
    // Remove the bootstrap and tag scripts
    //var scripts = document.getElementsByTagName("script");
    // debugger;
    // console.log(scripts);
    // var preview = scripts[1];
    // preview.parentNode.removeChild(preview);
    //var tag = scripts[1];
    //tag.parentNode.removeChild(tag);

    // Mobify.dnsPrefetch = dnsPrefetch;
    // Mobify.keepWarm = keepWarm;
    // Mobify.speedClick = speedClick;

    var swiftData = {
        "jazzcat": {
            "safe": true,
            "defaults": [
                {
                    "does": true,
                    "matchType": "contains", // contains, startswith, endswith, regex
                    "match": "adsense"
                }   
            ],
            "excludes": [
                {
                    "does": false,
                    "matchType": "contains", // contains, startswith, endswith, regex
                    "match": "jquery-ui"
                }
            ]
        },
        "ir": {
            "defaults": [
                {
                    "does": true,
                    "matchType": "contains", // contains, startswith, endswith, regex
                    "match": "quantcast"
                }   
            ],
            "excludes": [
                {
                    "does": true,
                    "matchType": "contains", // contains, startswith, endswith, regex
                    "match": "adsense"
                }
            ] 
        },
        "dom": {
            "excludes": [
                {
                    "conditionType": "mediaquery", // mediaquery, javascript
                    "condition": "(max-width: 400px)",
                    "matchType": "css",
                    "match": ".main img" // img, div, script, etc, *
                }
            ]
        }
    }

    // Initiate capture
    var capture = Mobify.Capture.init();

    // Grab reference to a newly created document
    var capturedDoc = capture.capturedDoc;

    // Exclude some DOM elements
    if (swiftData.dom) {
        [].forEach.call(swiftData.dom.excludes, function(exclude){
            if (window.matchMedia && window.matchMedia(exclude.condition)) {
                Mobify.Utils.removeBySelector(exclude.match);
            }
        })
    }

    // Concatinate Javascript using Jazzcat
    if (swiftData.jazzcat) {
        var scripts = capturedDoc.querySelectorAll('script');
        var scriptExcludes = swiftData.jazzcat.defaults.concat(swiftData.jazzcat.excludes);
        var filteredScripts = Mobify.Utils.elementFilter(scripts, scriptExcludes);
        Mobify.Jazzcat.combineScripts(filteredScripts, {
            doc: capturedDoc
        });
    }

    // Resize images using Mobify Image Resizer
    if (swiftData.ir) {
        var images = capturedDoc.querySelectorAll('script');
        var imageExcludes = swiftData.ir.defaults.concat(swiftData.ir.excludes);
        var filteredScripts = Mobify.Utils.elementFilter(scripts, scriptExcludes);
        Mobify.ResizeImages.resize( capturedDoc.querySelectorAll("img"), { 
            projectName: "mobifycom",
            maxWidth: 320 
        });
    }

    // Render source DOM to document
    capture.renderCapturedDoc();
}