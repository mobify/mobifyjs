---
layout: docv2
title: Mobify.js Documentation
---

# Quick Start

## What is Mobify.js?

Mobify.js is a library for adapting websites across a number of different kinds of devices. One of the core features of Mobify.js is it's ability to capture and 
manipulate the DOM before any resources have downloaded, which unlocks the ability to do resource control, conditional loading, image resizing, javascript 
concatination and more.


## Instructions

1. Install the Mobify.js tag in your site. It must be placed **immediately** after
the opening <head> tag. ([Non-minified version on Github](https://github.com/mobify/mobifyjs/blob/v2.0-documentation/tag/bootstrap.html)):

    <pre id="mobify-tag"><code class="javascript">&lt;script class="mobify" id="mobify-tag">(function(a,b,c,d,e){function f(a,c,d){var e=b.createElement("script"),f=b.getElementById("mobify-tag");return e.src=a,e.id=c,e.setAttribute("class",d),f.parentNode.insertBefore(e,f),e}!this.Mobify&&c()&&(b.write('&lt;plaintext style="display:none">'),setTimeout(function(){a.capturing=!0;var b=f(d,"mobify-js","mobify");b.onload=function(){e&&f(e,"mobify-js-main","mobify")}}))})(window,document,function(){var b,a=/webkit|msie\s10|(firefox)[\/\s](\d+)|(opera)[\s\S]*version[\/\s](\d+)|3ds/i.exec(navigator.userAgent);return a&&(b=a[1]&&"firefox"===a[1].toLowerCase()&&4>+a[2]?!1:a[3]&&"opera"===a[3].toLowerCase()&&11>+a[4]?!1:!0),b?!0:!1},"//cdn.mobify.com/mobifyjs/mobify-2.0.0alpha1.min.js","/PATH/TO/main.js");&lt;/script></code></pre>

2. Create a new javascript file called `main.js`, and correctly
set the path to this script by replacing /PATH/TO/ with the
path to your new script.

3. Copy the following code into your new js file. It is a script which contains a number of examples on how you can use the API:

    <pre><code class="javascript">
    var capturing = window.capturing || false;
    if (capturing) {
        console.log("Executing during capturing phase!");

        // Grab reference to the captured document
        var capture = Mobify.Capture.init();
        var capturedDoc = capture.capturedDoc;

        var grumpyUrl = "http://pics.blameitonthevoices.com/092012/small_grumpy%20cat%20caption.jpg";

        var imgs = capturedDoc.getElementsByTagName("img");
        for(var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            // To escape content, we prepend resources with x-,
            // so to change the src, you must set x-src. Read more:
            // www.mobifyjs.com/v2/docs/capturing/#new-mobifycapturedocument-prefixx-
            img.setAttribute("x-src", grumpyUrl);
        }

        // Render captured dom back to original document
        capture.renderCapturedDoc();

    } else {
        console.log("Executing during post-capturing phase!");
    }
    </code></pre>

4. Browse to your site on a compatible browser - WebKit (Chrome, Safari, etc), FF4 or greater, Opera 11/12, IE10. Also, browse to a page with images to see the full effect of the grumpy cat!


## Where to next?

* [What can I do with Capturing?](./capturing/)
* [Dynamic image resizing](./image-resizing/)
* [Adapt your site using client-side templating](./templating/)
* [Read tips for debugging Mobify.js in the Appendix](./appendix/)
