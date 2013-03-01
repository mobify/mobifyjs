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
                    "conditionType": "does"
                    "condition": true,
                    "matchType": "contains", // contains, startswith, endswith, regex
                    "match": "adsense"
                }   
            ],
            "excludes": [
                {
                    "conditionType": "does"
                    "condition": true,
                    "matchType": "contains", // contains, startswith, endswith, regex
                    "match": "jquery-ui"
                }
            ]
        },
        "ir": {
            "defaults": [
                {
                    "conditionType": "does"
                    "condition": true,
                    "matchType": "contains", // contains, startswith, endswith, regex
                    "match": "quantcast"
                }   
            ],
            "excludes": [
                {   
                    "conditionType": "does"
                    "condition": true,
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
                    "matchType": "css"
                    "match": ".main img"
                }
            ]
        }
    }

    // Initiate capture
    var capture = Mobify.Capture.init();

    // Grab reference to a newly created document
    var capturedDoc = capture.capturedDoc;

    var scripts = capturedDoc.querySelectorAll('script');
    var jcResult = Mobify.Jazzcat.combineScripts(scripts);
    for (var i=0,ii=jcResult.length;i<ii;i++) {
        capturedDoc.body.appendChild(jcResult[i]);
    }

    Mobify.dnsPrefetch(capturedDoc);
    Mobify.keepWarm();

    // Resize images using Mobify Image Resizer
    Mobify.ResizeImages.resize( capturedDoc.querySelectorAll("img"), 
                                { 
                                  projectName: "mobifycom",
                                  maxWidth: 320 
                                });

    // Render source DOM to document
    capture.renderCapturedDoc();
}