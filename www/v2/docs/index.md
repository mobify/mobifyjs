---
layout: docv2
title: Mobify.js Documentation
---

# Quick Start

## What is Mobify.js?

Mobify.js is a library for adapting websites across a number of different kinds
of devices. Core to Mobify.js is its ability to capture and  manipulate the DOM
before any resources have downloaded, which unlocks the ability to do resource
control, conditional loading, image resizing, javascript  concatination and
more.


## Instructions

1. Install the Mobify.js tag on your site. It must be placed **immediately** after
   the opening <head> tag. [unminified][]:

<pre id="mobify-tag"><code class="html">&lt;script>(function(a,b,c,d,e){function f(a,c,d){var e=b.createElement("script"),f=b.getElementsByTagName("script")[0];return e.src=a,e.id=c,e.setAttribute("class",d),f.parentNode.insertBefore(e,f),e}!this.Mobify&&c()&&(b.write('&lt;plaintext style="display:none">'),setTimeout(function(){var b=a.Mobify=a.Mobify||{};b.capturing=!0;var c=f(d,"mobify-js","mobify");c.onload=function(){e&&f(e,"mobify-js-main","mobify")}}))})(window,document,function(){return match=/webkit|msie\s10|(firefox)[\/\s](\d+)|(opera)[\s\S]*version[\/\s](\d+)|3ds/i.exec(navigator.userAgent),match?match[1]&&4>+match[2]?!1:match[3]&&11>+match[4]?!1:!0:!1},"//cdn.mobify.com/mobifyjs/mobify-2.0.0alpha1.min.js","/PATH/TO/main.js");
&lt;/script></code></pre>

2. Create a new JavaScript file called `main.js`, and correctly
   set the path to this script by replacing /PATH/TO/ with the
   path to your new script.

3. Copy the following code into your `main.js`. It is an example which will
   replace all images with grumpy cats on your site and will NOT load the
   original images:

<pre><code class="javascript">var capturing = window.capturing || false;
if (capturing) {
    console.log("Executing during capturing phase!");

    // Grab reference to the captured document
    var capture = Mobify.Capture.init();
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

} else {
    console.log("Executing during post-capturing phase!");
}</code></pre>

4. Browse to your site on a compatible browser - WebKit (Chrome, Safari, etc),
  FF4 or greater, Opera 11/12, IE10. Also, browse to a page with images to see the
  full effect of the grumpy cat!

- Note: You may also want to open up network tab of the web inspector on your browser to see that
        the original images from your site were not downloaded.


## Where to next?

* [Read our in-depth tutorial](./tutorial/)
* [Capturing Reference](./capturing/)


[unminified]: https://github.com/mobify/mobifyjs/blob/v2.0/tag/bootstrap.html