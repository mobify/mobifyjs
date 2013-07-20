---
layout: docv2
title: Mobify.js Documentation
---

# Quick Start

## What is Mobify.js?

Mobify.js is an open source library for improving the performance of responsive
sites by providing automatic responsive images, JavaScript/CSS optimization and more. Mobify.js
can also be used for creating new sites using Adaptive Templating. Core to Mobify.js is the
ability to capture and manipulate the DOM before any resources have downloaded.

## Getting started

Let's get started by using the [Image API](/mobifyjs/v2/docs/image-resizer/)
(one of many APIs available in mobify.js)
to automatically resize and optimize images in your page.

- Note: If you're using this API locally and your images aren't publicly
available, the original images will load. To see the images resize, try this
on an environment that is publicly available.

<u>With Capturing</u>

If you don't want to have to worry about changing `src` attributes, you can let
[Capturing](/mobifyjs/v2/docs/capturing/) take care of that for you. It requires
a special script tag that must
be placed after the opening <code>&lt;head&gt;</code> tag (**must be placed above
any element that loads external resources!**):
[Unminified version on Github](https://github.com/mobify/mobifyjs/blob/v2.0/tag/bootstrap.html){: target='_blank' }

    <script>!function(a,b,c,d,e){function g(a,c,d,e){var f=b.getElementsByTagName("script")[0];e.src?a.src=e.src:e.innerHTML&&(a.innerHTML=e.innerHTML),a.id=c,a.setAttribute("class",d),f.parentNode.insertBefore(a,f)}a.Mobify={points:[+new Date]};var f=/((; )|#|&|^)mobify=(\d)/.exec(location.hash+"; "+b.cookie);if(f&&f[3]){if(!+f[3])return}else if(!c())return;b.write('<plaintext style="display:none">'),setTimeout(function(){var c=a.Mobify=a.Mobify||{};c.capturing=!0;var f=b.createElement("script"),h=function(){var c=new Date;c.setTime(c.getTime()+18e5),b.cookie="mobify=0; expires="+c.toGMTString()+"; path=/",a.location=a.location.href};f.onload=function(){if(e){var a=b.createElement("script");if(a.onerror=h,"string"==typeof e)g(a,"main-executable","mobify",{src:e});else{var c="var main = "+e.toString()+"; main();";g(a,"main-executable","mobify",{innerHTML:c})}}},f.onerror=h,g(f,"mobify-js","mobify",{src:d})})}(window,document,function(){return match=/webkit|msie\s10|(firefox)[\/\s](\d+)|(opera)[\s\S]*version[\/\s](\d+)|3ds/i.exec(navigator.userAgent),match?match[1]&&+match[2]<4?!1:match[3]&&+match[4]<11?!1:!0:!1},

    // path to mobify.js
    "//cdn.mobify.com/mobifyjs/build/mobify-2.0.0alpha4.min.js",

    // calls to APIs go here (or path to a main.js)
    function() {
      var capturing = window.Mobify && window.Mobify.capturing || false;

      if (capturing) {
        Mobify.Capture.init(function(capture){
          var capturedDoc = capture.capturedDoc;

          var images = capturedDoc.querySelectorAll("img, picture");
          Mobify.ResizeImages.resize(images);
            
          // Render source DOM to document
          capture.renderCapturedDoc();
        });
      }
    });</script>


<u>Without Capturing</u>

If you want to use the [Image API](/mobifyjs/v2/docs/image-resizer/)
without [Capturing](/mobifyjs/v2/docs/capturing/), you must change
`src` to `data-src` for every <code>&lt;img&gt;</code> and 
<code>&lt;picture&gt;</code> element you have in your site (you
also may want to add <code>&lt;noscript&gt;</code> fallbacks if you're worried
about browsers with JavaScript disabled/unavailable).

Then, paste the following tag before <code>&lt;/body&gt;</code>:

    <script src="//cdn.mobify.com/mobifyjs/build/mobify-2.0.0alpha4.min.js">
    <script>
      var images = document.querySelectorAll("img, picture");
      Mobify.ResizeImages.resize(images);
    </script>

## Where to next?

* [Capturing API Reference](./capturing/)
* [Image API Reference](./image-resizer/)


