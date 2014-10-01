---
layout: docv2
title: Mobify.js Documentation
---

# Quick Start

## What is Mobify.js?

Mobify.js is an open source library for improving responsive sites
by providing responsive images, JS/CSS optimization, Adaptive
Templating and more. Mobify.js also provides a 
"Capturing" API for manipulating the DOM before any resources have
loaded, giving developers the ability to enable the listed features above
without changing any backend markup.

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

{% include paid_warning.html %}

    <script>!function(a,b,c,d,e){function g(a,c,d,e){var f=b.getElementsByTagName("script")[0];a.src=e,a.id=c,a.setAttribute("class",d),f.parentNode.insertBefore(a,f)}a.Mobify={points:[+new Date]};var f=/((; )|#|&|^)mobify=(\d)/.exec(location.hash+"; "+b.cookie);if(f&&f[3]){if(!+f[3])return}else if(!c())return;b.write('<plaintext style="display:none">'),setTimeout(function(){var c=a.Mobify=a.Mobify||{};c.capturing=!0;var f=b.createElement("script"),h="mobify",i=function(){var c=new Date;c.setTime(c.getTime()+3e5),b.cookie="mobify=0; expires="+c.toGMTString()+"; path=/",a.location=a.location.href};f.onload=function(){if(e)if("string"==typeof e){var c=b.createElement("script");c.onerror=i,g(c,"main-executable",h,mainUrl)}else a.Mobify.mainExecutable=e.toString(),e()},f.onerror=i,g(f,"mobify-js",h,d)})}(window,document,function(){a=/webkit|(firefox)[\/\s](\d+)|(opera)[\s\S]*version[\/\s](\d+)|(trident)[\/\s](\d+)/i.exec(navigator.userAgent);return!a||a[1]&&4>+a[2]||a[3]&&11>+a[4]||a[5]&&6>+a[6]?!1:!0},

    // path to mobify.js
    "//cdn.mobify.com/mobifyjs/build/mobify-2.0.15.min.js",

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
`src` to `x-src` (this is configurable) for every <code>&lt;img&gt;</code> and 
<code>&lt;picture&gt;</code> element you have in your site (you
also may want to add <code>&lt;noscript&gt;</code> fallbacks if you're worried
about browsers with JavaScript disabled/unavailable). This snippet will
load mobify.js asynchronously in order to be able to start loading images before
the DOM is ready.

Then, paste the following tag before <code>&lt;/head&gt;</code>, or top of
<code>&lt;body&gt;</code>:

{% include paid_warning.html %}

    <script async src="//cdn.mobify.com/mobifyjs/build/mobify-2.0.15.min.js"></script>
    <script>
        var intervalId = setInterval(function(){
            if (window.Mobify) {
                var images = document.querySelectorAll('img[x-src], picture');
                if (images.length > 0) {
                    Mobify.ResizeImages.resize(images);
                }
                // When the document has finished loading, stop checking for new images
                if (Mobify.Utils.domIsReady()) {
                    clearInterval(intervalId)
                }
            }
        }, 100);
    </script>

## Where to next?

* [Capturing API Reference](./capturing/)
* [Image API Reference](./image-resizer/)


