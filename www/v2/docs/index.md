---
layout: doc
title: Mobify.js Documentation
---

# Quick Start

Mobify.js is a JavaScript library for adapting websites across every device.

1. Install the Mobify.js tag in your site:

    <pre id="mobify-tag"><code>&lt;script class="mobify" id="mobify-tag">(function(a,b,c,d,e){function f(a,c,d){var e=b.createElement("script"),f=b.getElementById("mobify-tag");return e.src=a,e.id=c,e.setAttribute("class",d),f.parentNode.insertBefore(e,f),e}!this.Mobify&&c()&&(a.Mobify={points:[+new Date]},b.write('&lt;plaintext style="display:none">'),setTimeout(function(){a.capturing=!0;var b=f(d,"mobify-js-library","mobify");b.onload=function(){e&&f(e,"mobify-js-main","mobify")}}))})(window,document,function(){var b,a=/webkit|msie\s10|(firefox)[\/\s](\d+)|(opera)[\s\S]*version[\/\s](\d+)|3ds/i.exec(navigator.userAgent);return a&&(b=a[1]&&"firefox"===a[1].toLowerCase()&&4>+a[2]?!1:a[3]&&"opera"===a[3].toLowerCase()&&11>+a[4]?!1:!0),b?!0:!1},"//cdn.mobify.com/mobifyjs/mobify-2.0.0.min.js","/path/to/script.js");&lt;/script></code></pre>

(to see the source code for this tag, [check it out on Github](https://github.com/mobify/mobifyjs/blob/v2.0-capture-refactor/tag/bootstrap.html)!)

2. Create a new javascript file, and change `/path/to/script.js` in the tag above
to your newly created file.

3. Copy the following code into your new js file. It is a script which contains a number of examples on how you can use the API:

    <pre><code>
    var capturing = window.capturing || false;
    if (capturing) {
        console.log("Executing main during capturing phase!")

        // Grab reference to the captured document
        var capture = new Mobify.Capture();
        var capturedDoc = capture.capturedDoc;

        /* Example 1: Remove a script that you don't want loaded on iPad
        if (/ipad/i.test(navigator.userAgent)) {
            var adscript = capturedDoc.getElementById("#giantAdScript")
        }
        // Render captured dom back to original document
        capture.renderCapturedDoc({injectMain: true});

        // Don't forget, only have one example uncommented at a time!
        */

        // Example 2: Render entirely new document
        var title = capturedDoc.getElementsByTagName("title")[0].textContent;
        var html = "&lt;html&gt;&lt;head&gt;&lt;/head&gt;&lt;body&gt;&lt;h1&gt;Captured page title - " + title + "&lt;/h1&gt;&lt;/body&gt;&lt;/html&gt;";
        // Render newly created html back to original document
        capture.render(html);    

    } else {
        console.log("Executing main in post-capturing phase!");
    }
    </code></pre>

4. Browse to your site and play around with the examples (commented out in the code chunk above).

## How Mobify.js works

Mobify.js is a library that allows you to make a number of different kinds of adaptations to your existing site for all kinds of different devices.

## Where to next?

* [What can I do with Capturing?](./capturing/)
* [Dynamic image resizing](./image-resizing/)
* [Adapt your site using client-side templating](./templating/)
* [Read tips for debugging Mobify.js in the Appendix](./appendix/)
