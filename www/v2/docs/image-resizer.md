---
layout: docv2
title: Mobify.js Documentation
---

# Image Resizer

- Automatically resize `<img>` and `<picture>` elements to the maximum width
of the screen.
- Automatically determine support for `WEBP`, and convert images on the fly.
- Manual resize of `<picture>` elements by specifying different widths
on each `<source>` element breakpoint.
- Cache all images on Mobify's CDN.
- Image resizing powered by the [Mobify Performance Suite](https://cloud.mobify.com){: target='_blank' }.
- Can be overridden to use another resizing service.

To automatically add resizing to your site without modifying any markup on your backend,
you must have the ability to [Capture](/mobifyjs/v2/docs/capturing/) the DOM, 
which requires the Mobify.js tag on your site.
You can also use this API if you have access to change all `src` to `x-src` in your backend
markup.

Please refer to the  [quickstart guide](/mobifyjs/v2/docs/) to get setup.


* TOC
{:toc}

## `ResizeImages.resize(images, [options])`

__images__ must be an array of `<img>` and/or `<picture>` elements.

__options__ are optional.

Rewrites the `src` of every `<img>/<picture>` in the `images` array on the page based 
on the options passed. 

- By default, images are requested through `ir0.mobify.com` (part of the [Mobify Performance Suite](https://cloud.mobify.com){: target='_blank' }).
- Maximum dimensions are based on the size of the device, taking into 
account pixel density. This can be overridden in the `options`.
- Determines support for WEBP and uses that on images whenever possible.
Otherwise it defaults to the original image format.

**Note: The image resizer backend must have access to the images in order to 
resize them. If your development server is not publicly accessible, 
ir0.mobify.com will serve a 302 redirect back to the original image location.**

<div class="alert alert-block">
    <p>Our image resizing service backend service is free to use up to a certain
    number of views per month. If you plan on using this service on a website with high amounts of traffic, feel free to visit our 
    <a href="http://www.mobify.com/pricing/">pricing page</a> for more detail.
    </p>
</div>

**Options**

- `sourceAttribute`: The attribute to get the source value from. Defaults to 
  "x-src". "x-" is the default escape prefix used in [Capturing](/mobifyjs/v2/docs/capturing/)
- `targetAttribute`: The attribute to set witht he resized url. Defaults to 
  "x-src" when capturing, and "src" without capturing.
- `cacheHours`: Sets the length of time for the image(s) to be cached on the CDN. 
  The default is 8 hours.
- `format`: Output format of the image(s) being resized, one of 'jpg', 'png, 
'webp' or the special format specifier 'q', which will return an image in its
original format, but allows quality to be specified on its own. Defaults to 
original format, except non-animated gifs, which are converted to png.
- `quality`: An integer from 1-100 used as a quality parameter when encoding 
  jpg and webp images, can only be set along with the `format` parameter.
- `maxWidth`: Maximum width of the image(s) being resized (in CSS pixels). 
  Defaults to automatically determine width of device.
- `maxHeight`: Maximum height of the image(s) being resized (in CSS pixels). 
  Only usable when maxWidth is specified.
- `devicePixelRatio`: Override the default devicePixelRatio. Defaults to 
  `window.devicePixelRatio.`
- `resize`: A boolean that controls whether to scale the image(s). When
  false, the image(s) are served through the image resizer backend but are not
  resized. A value of null auto detects whether to resize images from the
  document's viewport meta tag. The default is true.
- `cacheBreaker`: A string used to break the cache. By default, the Image
  Resizer service caches images to avoid reprocessing the same image more than
  once. Use this option if you change an image and need to break Image Resizer's
  cache.

**Profiles**
Some options presets are provided on `ResizeImages.profiles`

- `SHORT_CACHE` sets a 2 hour cache lifetime on the resulting asset, for images
that might change without changing URL.
- `LONG_CACHE` sets a one week cache lifetime for assets that will remain valid
for longer periods.

You can combine these profiles with your own options objects like so:

    var options = Utils.extend({
        < your options >
        }, ResizeImages.profiles.SHORT_CACHE);

**Example**

There are many examples using Image Resizer on the 
[examples](/mobifyjs/v2/examples) page.

Automatic image resizing (using Capturing):

    Mobify.Capture.init(function(capture){
        var capturedDoc = capture.capturedDoc;
        // Resize images using Mobify Image Resizer
        var images = capturedDoc.querySelectorAll('img, picture');
        Mobify.ResizeImages.resize( images, {
            cacheHours: "2",
        } );
        capture.renderCapturedDoc();
    });

Specify a custom width for a group of images:

    Mobify.Capture.init(function(capture){
        var capturedDoc = capture.capturedDoc;
        // Resize images using Mobify Image Resizer
        var images = capturedDoc.querySelectorAll('#footer img');

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

This method takes a URL and modifies it based on the options passed. It is 
executed by `ResizeImages.resize` for each element. It can be overridden to use
this API for a different image resizing service (such as 
[src.sencha.io](http://www.sencha.com/learn/how-to-use-src-sencha-io/)).

If you want to get a resized URL string (instead of resizing an img element),
this is the method to use.

**Options**

The same as `ResizeImages.resize` options.

**Usage/Examples:**

    // Override getImageURL to use the src.sencha.io backend
    Mobify.ResizeImages.getImageURL = function(url, options) {
        return "http://src.sencha.io/" + options.maxWidth + "/" + url  
    };

    // Get an optimized image URL from a URL string
    Mobify.ResizeImages.getImageURL('http://www.foo.com/bar.png');

    // Get an optimized image URL from a URL string with options overridden
    var options = Utils.extend(ResizeImages.processOptions(), {
        cacheHours: '8', 
    });
    Mobify.ResizeImages.getImageURL('http://www.foo.com/bar.png', options);


## `ResizeImages.processOptions()`

This method returns all of the default options.

**Usage/Examples:**

    Mobify.ResizeImages.processOptions()

    // returns (for iPhone 5):
    // {
    //     proto: '//',
    //     host: 'ir0.mobify.com',
    //     projectName: "oss-" + location.hostname.replace(/[^\w]/g, '-'),
    //     sourceAttribute: "x-src",
    //     targetAttribute: (capturing ? "x-src" : "src"),
    //     webp: ResizeImages.supportsWebp(),
    //     onerror: 'ResizeImages.restoreOriginalSrc(event);'
    //     maxWidth: 640
    // }


## WebP

[WebP](https://developers.google.com/speed/webp/) is a new image file format from Google which offers significantly smaller file sizes than JPEG compression with similar image quality.

Using the Image Resizer API with Mobify.js, image files referenced by your img 
and picture elements will automatically be converted to WebP for browsers that
support it. This can have a significant impact on the total weight of your pages
for supported browsers.

Have a look at [http://caniuse.com/webp](http://caniuse.com/webp) to see the
current state of browser support for this format.

## Simplified Picture Element

Mobify.js comes with a `<picture>` polyfill. In combination with the Image Resize
API, you can have much simplier `<picture>` elements. You also no longer need
a &lt;noscript> fallback when using the Resize API (with Capturing).

The problem with the `<picture>` element is that using it to specify the same
image at different widths can be extremely tedious. Nobody wants to generate 4
versions of every image at all of the possible resolutions, and constantly 
update those versions in the markup. Scaling image widths can be automated
(although the `<picture>` element is the best solution for art direction).

To solve this problem, Mobify.js allows for alternate `<picture>` markup that
allows you to specify widths as attributes on `<source>` elements, instead of
specifying a different `src` attribute for each breakpoint. 

For example, you could write your element like this:

    <picture data-src="horse.png">
        <source src="alt-horse.png" data-media="(max-width: 480px)">
        <source media="(min-width: 480px)" data-width="200">
        <source media="(min-width: 800px)" data-width="400">
        <source media="(min-width: 1000px)">
        <img src="horse-small.png">
    </picture>

Notice the use of the `data-src` attribute inside of the `<picture>` element. 
This gives us a basis that we can resize to produce an asset for other 
breakpoints. 

Let's break down how this will actually work in the browser:

- If the browser width is between 0 and 480px (smartphone):
    - Use "alt-horse.png" for art direction purposes.
- If the browser width is between 480px and 799px:
    - Use "horse.png" since `src` is not specified in the `<source>` element corresponding to that media query. Resize to 200px wide.
- If the browser width is between 800px and 999px:
    - Use "horse.png" since `src` is not specified in the `<source>` element corresponding to that media query. Resize to 400px wide.
- If the browser width is 1000px or greater:
    - Use "horse.png" since `src` is not specified in the `<source>` element 
    corresponding to that media query. Automatically determine width since 
    `data-width` isn't specified.
- If Javascript isn't supported, fallback to regular old `<img>` tag. 
(which needs no &lt;noscript> wrapping as with other solutions).

The `resize` method will cause the above markup to transform into this (on an iPhone):

    <picture data-src="horse.png">
        <source src="ir0.mobify.com/320/http://site.com/alt-horse.png" data-media="(max-width: 480px)">
        <source src="ir0.mobify.com/200/http://site.com/horse.png" media="(min-width: 480px)" data-width="200">
        <source src="ir0.mobify.com/400/http://site.com/horse.png" media="(min-width: 800px)" data-width="400">
        <source src="ir0.mobify.com/320/http://site.com/horse.png" media="(min-width: 1000px)">
        <img src="horse-small.png">
    </picture>

After `resize` changes the markup, the Picture polyfill will run and select the appropriate image based on running the media queries.

## ir0.mobify.com

Mobify's image resizing backend that can manipulate the width, height, file
format, and quality of any image. All requests through this service are cached 
on Mobify's CDN.

The image resizer API in Mobify.js uses this service by default for image
manipulation.

Requests are in the form of:

    http://ir0.mobify.com/<format><quality>/<maximum width>/<maximum height>/<url>

Visit [http://ir0.mobify.com](http://ir0.mobify.com) to understand the API in 
more detail.

## Browser Support

### With Capturing (fully tested)

| Browser                      | Version |
|------------------------------|---------|
| Webkit (Safari, Chrome, etc) | *       |
| Firefox                      | 4.0+    |
| Opera                        | 11.0+   |
| Internet Explorer            | 10+     |

### Without Capturing

Support for using the API without Capturing is untested. At minimum, it will
support everything in the table above, but will cover many more older browsers
due to Capturing not being required.
