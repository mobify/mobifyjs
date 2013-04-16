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

Rewrites the `src` of every image on the page based on the options
passed. By default, images are requested through `ir0.mobify.com`,
maximum width is determined by the width of the device, format of
the image is maintained, and the image is cached forever.

**Options**

- `attribute`: `img` resource attribute to modify. Defaults to "x-src". "x-" is the default escape prefix used in [Capturing](/mobifyjs/v2/docs/capturing/)
- `projectName`: The project slug of the project on Mobify Cloud. Defaults to ""
- `cacheHours`: Sets the length of time for the image(s) to be cached on the CDN. Defaults to forever.
- `format`: Format of the image(s) being resized. Defaults to original format, except gifs, which are converted to pngs.
- `maxWidth`: Width of the image(s) being resized. Defaults to automatically determine width of device.
- `maxHeight`: Height of the image(s) being resized. Only usable when maxWidth is specified.

**Example**

    Mobify.Capture.init(function(capture){
        var capturedDoc = capture.capturedDoc;
        // Resize images using Mobify Image Resizer
        var images = capturedDoc.querySelectorAll('img');
        Mobify.ResizeImages.resize( images, {
            projectName: "mobifytest",
            cacheHours: "2",
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


## Browser Support


| Browser                      | Version |
|------------------------------|---------|
| Webkit (Safari, Chrome, etc) | *       |
| Firefox                      | 4.0+    |
| Opera                        | 11.0+   |
| Internet Explorer            | 10+     |
