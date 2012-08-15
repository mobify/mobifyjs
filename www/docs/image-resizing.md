---
layout: doc
title: Resizing Images with Mobify.js
---

**This is a [Mobify Cloud](https://cloud.mobify.com/) feature, you must be a 
Mobify Cloud user to use image resizing with Mobify.js**

# Resizing Images with Mobify.js

Mobify provides an image resizing web-service. Serving images of
appropriate size and quality to mobile users can drastically improve
load and rendering time for image heavy pages. Images retrieved through
the service are automatically cached in the Mobify Cloud's Content
Distribution Network, for speedy retrieval around the globe.

For basic usage, simply prepend the host `ir0.mobify.com` to existing
images:

    <img src="//www.mobify.com/i/logo-mobify-sm.png" />
    <img src="//ir0.mobify.com/http://www.mobify.com/i/logo-mobify-sm.png" />

Mobify.js provides `$.fn.resizeImages()` to help use the image resizer.

### `.resizeImages ( )`

*Changes the `src` of matched elements to be loaded through the Mobile
Cloud.*

-   `.resizeImages ( )`
-   `.resizeImages ( width )`
-   `.resizeImages ( options )`

### Usage

`$.fn.resizeImages` is used to change images in the konf.

Passing no arguments loads matched images through the Mobile Cloud:

    'content': function() {
        var $content = $('content');
        $content.resizeImages();
        return $content;
    }

Passing an integer as the first argument restricts the width of matched
elements:

    'thumbnails': function() {
        return $('img.preview_image').resizeImages(60);
    }

Pass an object to further customize behaviour:

    'profileImage': function() {
        var options = {
                maxWidth: 80
              , maxHeight: 80
              , format: 'jpg'
              , quality: 50
            };
        return $('#profileImage').resizeImages(options);
    }

Note that the quality parameter will only be honoured for JPEG images.

### Styling

Use CSS to style image elements by setting max-width to your desired
width and max-height to auto. This way the image will be layed out
correctly regardless of the pixel dimensions of the returned image. Be
sure that your desired width is not greater than the original image
dimensions.

    // Konf, desired image size is 200 CSS pixels wide.
    $('img').resizeImages(200)

    /* CSS */
    img {
        max-width: 200px;
        height: auto;
    }

    <!-- Output -->
    <img src="http://ir0.mobify.com/200/http://www.mobify.com/wp-content/uploads/2011/12/home-mobile-transformation.png" />

Notes
=====

-   If the resized file is larger than than the original file, and no
    change format has been specified, the original image will be served.

-   All pixel sizing arguments should be given in CSS pixels. Scaling to
    device pixels is handled automatically.

-   Requests are automatically sharded across several domains to
    minimize blocking.

-   Resized GIFs will be output as 24-bit PNGs.

-   Images are cached indefinitely.


