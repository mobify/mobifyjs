---
layout: docv2
title: Mobify.js Documentation
---

# Image Resizer

To use the Image Resizer API, you must first install the Mobify.js tag on your site.
If you have not already, please refer to the  [quickstart guide](/mobifyjs/v2/docs/) to get setup.

* TOC
{:toc}

## `ResizeImages.resize(imgElements, [options])`

__imgElements__ must be an array of image elements to resize.

__options__ are optional.

Rewrites the `src` of every image in the array `imgElements` on the page based 
on the options passed. By default, images are requested through mobfy's image 
resizing web service, `ir0.mobify.com`, maximum dimensions are based on the 
size of the device, taking into account is pixel density, output format of 
images are maintained (except for gifs), and the requested image is cached 
indefinitely.

The image resizer backend must have access to the images in order to resize them. If your development server is not accessible on the publicly, 
`ir.mobify.com` will serve a 302 redirect back to the original image location.

Our image resizing service backend service is free to use up to a certain number
of views per month. If you plan on using this service on a website with high 
amounts of traffic, feel free to visit our 
[pricing page](http://www.mobify.com/pricing/) for more detail.

**Options**

- `attribute`: `img` element attribute to manipulate. Defaults to "x-src". "x-" is the default escape prefix used in [Capturing](/mobifyjs/v2/docs/capturing/)
- `projectName`: The project slug of the project on Mobify Cloud. Defaults to ""
- `cacheHours`: Sets the length of time for the image(s) to be cached on the CDN. Defaults to forever.
- `format`: Output format of the image(s) being resized. Defaults to original format, except gifs, which are converted to pngs.
- `maxWidth`: Maximum width of the image(s) being resized (in CSS pixes). Defaults to automatically determine width of device.
- `maxHeight`: Maximum height of the image(s) being resized (in CSS pixels). Only usable when maxWidth is specified.
- `devicePixelRatio`: Override the default devicePixelRatio. Defaults to window.devicePixelRatio.

**Example**

Automatic image resizing:

    Mobify.Capture.init(function(capture){
        var capturedDoc = capture.capturedDoc;
        // Resize images using Mobify Image Resizer
        var images = capturedDoc.querySelectorAll('img');
        Mobify.ResizeImages.resize( images, {
            cacheHours: "2",
        } );
        capture.renderCapturedDoc();
    });

Specify custom width:

    Mobify.Capture.init(function(capture){
        var capturedDoc = capture.capturedDoc;
        // Resize images using Mobify Image Resizer
        var images = capturedDoc.querySelectorAll('img');

        var maxWidth;
        if (window.matchMedia( "(min-width: 768px) and (max-width : 1024px)" ).matches) {
            maxWidth = 500;
        };

        Mobify.ResizeImages.resize( images, {
            cacheHours: 2,
            maxWidth: maxWidth
        } );
        capture.renderCapturedDoc();
    });

## `ResizeImages.getImageURL(url, [options])`

__url__ is the image URL being modifed.

__options__ are optional.

This method takes a URL and modifies it based on the options passed. It is executed
by `ResizeImages.resize` for each element. It can be overridden to use this API
for a different image resizing service (such as src.sencha.io).

**Options**

The same as `ResizeImages.resize` options.

**Usage/Example:**

    // Override getImageURL to use the src.sencha.io backend
    Mobify.ResizeImages.getImageURL = function(url, options) {
        return "http://src.sencha.io/" + options.maxWidth + "/" + url  
    };

## ir0.mobify.com

Mobify's image resizing backend that can manipulate the width, height, file
format, and quality of any image. All requests through this service are cached on Mobify's CDN.

The image resizer API in Mobify.js uses this service by default for image
manipulation.

Visit [http://ir0.mobify.com](http://ir0.mobify.com) to see full REST API.

## Browser Support


| Browser                      | Version |
|------------------------------|---------|
| Webkit (Safari, Chrome, etc) | *       |
| Firefox                      | 4.0+    |
| Opera                        | 11.0+   |
| Internet Explorer            | 10+     |
