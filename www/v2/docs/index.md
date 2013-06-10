---
layout: docv2
title: Mobify.js Documentation
---

# Quick Start

## What is Mobify.js?

Mobify.js is an open source library for improving the performance of responsive 
sites, as well as for creating new sites using Adaptive Templating. 
Core to Mobify.js is the ability to capture and manipulate the DOM
before any resources have downloaded, which unlocks the ability to do resource
control, conditional loading, image resizing, javascript  concatination and
more.


## Instructions

1. Install the Mobify.js tag on your site. It must be placed **immediately** after
   the opening <head> tag: [Unminified version on Github](https://github.com/mobify/mobifyjs/blob/v2.0/tag/bootstrap.html){: target='_blank' }

    <pre id="mobify-tag"><code class="javascript">&lt;script>(function(a,b,c,d,e){function g(a,c,d,e){var f=b.getElementsByTagName("script")[0];a.src=c,a.id=d,a.setAttribute("class",e),f.parentNode.insertBefore(a,f)}var f=/((; )|#|&|^)mobify=(\d)/.exec(location.hash+"; "+b.cookie);if(f&&f[1]){if(!+f[1])return}else if(this.Mobify||!c())return;a.Mobify={points:[+new Date]},b.write('&lt;plaintext style="display:none">'),setTimeout(function(){var c=a.Mobify=a.Mobify||{};c.capturing=!0;var f=b.createElement("script"),h=function(){var c=new Date;c.setTime(c.getTime()+18e5),b.cookie="mobify=0; expires="+c.toGMTString()+"; path=/",a.location=a.location.href};f.onload=function(){if(e){var a=b.createElement("script");a.onerror=h,g(a,e,"mobify-js-main","mobify")}},f.onerror=h,g(f,d,"mobify-js","mobify")})})(window,document,function(){return match=/webkit|msie\s10|(firefox)[\/\s](\d+)|(opera)[\s\S]*version[\/\s](\d+)|3ds/i.exec(navigator.userAgent),match?match[1]&&4>+match[2]?!1:match[3]&&11>+match[4]?!1:!0:!1},

    // path to mobify library
    "//cdn.mobify.com/mobifyjs/build/mobify-2.0.0alpha4.min.js",
    // path to main executable
    "/PATH/TO/main.js");
    &lt;/script></code></pre>

2. Create a new JavaScript file called `main.js`, and correctly
   set the path in the above script by replacing /PATH/TO/ with the
   path to your new script 
   **(note: in production, you should combine the mobify.js library and your main.js into one file, and change the path in your tag above)**.

3. Copy the following code into your `main.js`. It is an example which will
   replace all images with grumpy cats on your site and will NOT load the
   original images:

    <pre><code class="javascript">var capturing = window.Mobify && window.Mobify.capturing || false;
    if (capturing) {
        console.log("Executing during capturing phase!");

        // Instantiate capture and pass capture object upon completion
        Mobify.Capture.init(function(capture){
            var capturedDoc = capture.capturedDoc;

            var grumpyUrl = "http://pics.blameitonthevoices.com/092012/small_grumpy%20cat%20caption.jpg";

            var imgs = capturedDoc.getElementsByTagName("img");
            for (var i = 0; i < imgs.length; i++) {
                var img = imgs[i];
                // To escape content, we prepend resources with "x-",
                // so to change the src, you must set x-src. Read more:
                // www.mobifyjs.com/v2/docs/capturing/#new-mobifycapturedocument-prefixx-
                img.setAttribute("x-src", grumpyUrl);
            }

            // Render captured dom back to original document
            capture.renderCapturedDoc();
        });

    } else {
        console.log("Executing during post-capturing phase!");
    }</code></pre>

4. Browse to your site on a compatible browser - WebKit (Chrome, Safari, etc),
  FF4 or greater, Opera 11/12, and IE10. Also, browse to a page with images to see the full effect of the grumpy cat!

- Note: You may want to open up network tab of the web inspector on your browser 
to see that the original images from your site were not downloaded.


## Where to next?

* [Read our in-depth tutorial](./tutorial/)
* [Capturing Reference](./capturing/)

