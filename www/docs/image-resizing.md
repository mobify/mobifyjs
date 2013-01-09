---
layout: doc
title: Image Resizing | Mobify.js Framework Documentation
---

The image resizing service is a [Mobify Cloud](https://cloud.mobify.com/)
feature. You must be a Mobify Cloud user to use it with Mobify.js.

<a href="//cloud.mobify.com/" class="btn btn-primary rounded">Try Mobify Cloud for Free</a>

----

# Image Resizing with Mobify.js

Mobify provides an image resizing service to improve load and rendering
time for image heavy pages.

Imagine you are loading a page with a very large image on an iPhone:

    <img src="2000px_by_2000px.jpg" />

On most pages, there is no point in loading the image at such a high
resolution as it will look similiar to a smaller image after it is
scaled by the browser to fit its container.

The resizing service can be used to scale images to an appropriate size
for mobile devices, reducing their weight!

    <img src="//ir0.mobify.com/640/2000px_by_2000px.jpg" />

----

## Usage

Mobify.js provides an API to format images for use with the image
resizing service. Inside your konf, use `$` to select the images you
would like to resize and then format them using `resizeImages`:

    'img': function() {
        var $imgs = $('img').resizeImages();
        return $imgs;
    }

----

## Reference

### `$.fn.resizeImages`

Searches the collection for image elements and modifies images to use
the image resize service.

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

----

## Styling

Use CSS to style image elements by setting `max-width` to your desired
width and `max-height` to auto. This way the image will be layed out
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

----

##  Notes

- If the resized file is larger than than the original file, and no
  change format has been specified, the original image will be served.

- All pixel sizing arguments should be given in CSS pixels. Scaling to
  device pixels is handled automatically.

- Requests are automatically sharded across several domains to
  minimize blocking.

- Resized GIFs will be output as 24-bit PNGs.

- Images are cached indefinitely.