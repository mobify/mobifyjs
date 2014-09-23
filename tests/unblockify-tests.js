require(["mobifyjs/utils", "mobifyjs/capture", "mobifyjs/unblockify"], function(Utils, Capture, Unblockify) {
    window.Unblockify = Unblockify;

    module("Unblockify");
    asyncTest("moveScripts", function(){
        var iframe = $("<iframe>", {
            id: "unblock-test",
            src: "/tests/fixtures/unblock-example.html"
        });

        var iframeLoaded = false;
        iframe.load(function(){
            var doc = this.contentDocument;

            // Remove the webdriver attribute set when running tests on selenium (done through SauceLabs on various browsers (FF14 on OSX))
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver");

            var capture = Capture.init(function(capture){
                var capturedDoc = capture.capturedDoc;

                var scripts = Array.prototype.slice.call(capturedDoc.querySelectorAll("script")).filter(function(script){
                        if (script.hasAttribute("do-not-move")){
                            return false;
                        }
                        return true;
                });
                Unblockify.moveScripts(scripts, capturedDoc);

                if (iframeLoaded == false) {
                    iframeLoaded = true;
                    var expectedHtml = "<html class=\"testclass\"><head>    \
    <script type=\"text/mobify-script\" x-src=\"/path/to/script1.js\" do-not-move=\"\"><\/script>        </head><body>    <p>Unblock fixture page!</p><script type=\"text/mobify-script\" x-src=\"/path/to/script2.js\"><\/script><script type=\"text/mobify-script\" x-src=\"/path/to/script3.js\"><\/script></body></html>";
                    equal(removeNewlines(Utils.outerHTML(capturedDoc.documentElement)), expectedHtml, "Scripts moved to bottom, filtered-out script left in place");
                    start();
                }
            }, doc);
        });

        $("#qunit-fixture").append(iframe);
    });
    
});