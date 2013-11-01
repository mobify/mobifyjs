---
layout: examplev2
title: Mobify.js Examples
---

# Examples

----

## Image Resizing - IMG

This example uses the [Image Resizer API](/mobifyjs/v2/docs/image-resizer/)
in Mobify.js to resize img elements to the width of the browser. The key thing to
note is that the markup is completely semantic (no use of special `data-`
attributes), yet through the use of Capturing, we are able to restrict the
page to only download the resized images.

* [Image Resizing](http://cdn.mobify.com/mobifyjs/examples/resizeImages-img-element/index.html){: target='_blank' }

The following markup:

    <img src="/mobifyjs/examples/assets/images/forest.jpg">
    <img src="/mobifyjs/examples/assets/images/mountains.jpg">

is modified into this on the fly:

    <img src="//ir0.mobify.com/320/http://localhost:3000/mobifyjs/examples/assets/images/forest.jpg">
    <img src="//ir0.mobify.com/320/http://localhost:3000/mobifyjs/examples/assets/images/mountains.jpg">

The original image assets do not download.

You can find the source code here:

* [index.html](https://github.com/mobify/mobifyjs/tree/v2.0/examples/resizeImages-img-element/index.html
){: target='_blank' }

## Image Resizing - PICTURE

This example uses the [Image Resizer API](/mobifyjs/v2/docs/image-resizer/)
in Mobify.js to resize picture elements to the width of the browser.

The problem with the `picture` element is that using it to specify the same image at different widths can be extremely tedious. Nobody wants to generate 4 versions of every image at all of the possible resolutions, and constantly update those 
versions in the markup. Scaling image widths can be automated. (although the
`picture` element is the best solution for art direction).

To solve this problem, Mobify.js allows for alternate `picture` markup that
allows you to specify widths as attributes on `source` elements, instead of
specifying a different image for each breakpoint. 

* [Image Resizing](http://cdn.mobify.com/mobifyjs/examples/resizeImages-picture-element/index.html){: target='_blank' }

The following markup (URLs shortened for example):

    <picture data-src="extralarge.jpg">
        <source src="alternate_art.png" media="(min-width: 320px)" data-width="320">
        <source media="(min-width: 800px)" data-width="400">
        <source media="(min-width: 1000px)" data-width="500">
        <img src="small.jpg">
    </picture>

is modified into this on the fly:

    <picture data-src="extralarge.jpg">
        <source src="//ir0.mobify.com/project-oss-localhost/webp/320/1418/http://localhost:3000/mobifyjs/examples/assets/images/alternate_art.png" media="(min-width: 320px)" data-width="320">
        <source media="(min-width: 800px)" data-width="400" src="//ir0.mobify.com/project-oss-localhost/webp/400/1418/http://localhost:3000/mobifyjs/examples/assets/images/extralarge.jpg">
        <source media="(min-width: 1000px)" data-width="500" src="//ir0.mobify.com/project-oss-localhost/webp/500/1418/http://localhost:3000/mobifyjs/examples/assets/images/extralarge.jpg">
        <img data-orig-src="small.jpg">
    </picture>

You can find the source code here:

* [index.html](https://github.com/mobify/mobifyjs/tree/v2.0/examples/resizeImages-picture-element/index.html
){: target='_blank' }

## Picture Polyfill

The Picture element is the official W3C HTML extension for 
dealing with adaptive images. There are [polyfills that exist in 
order to use the Picture element in your site today](http://
scottjehl.github.com/picturefill/), but none of them are able to 
do a perfect polyfill - the best polyfill implemented thus far 
requires a `<noscript>` tag surrounding an `img` element in 
order to support browsers without Javascript. Using Capturing, 
you can avoid this completely.

Open the example and be sure to fire up the network tab 
in web inspector to see which resources get downloaded:

* [Picture Polyfill Example](http://cdn.mobify.com/mobifyjs/examples/capturing-picturepolyfill/index.html){: target='_blank' }

Here is the important chunk of code that is in the source of the example:

    <picture>
        <source src="/examples/assets/images/small.jpg">
        <source src="/examples/assets/images/medium.jpg" media="(min-width: 450px)">
        <source src="/examples/assets/images/large.jpg" media="(min-width: 800px)">
        <source src="/examples/assets/images/extralarge.jpg" media="(min-width: 1000px)">
        <img src="/examples/assets/images/small.jpg">
    </picture>

Take note that there is an `img` element that uses an `src` 
attribute, but the browser only downloads the correct image. You 
can see the code for this example here (note that the polyfill 
is only available in the example, not the library itself - yet):

* [index.html](https://github.com/mobify/mobifyjs/tree/v2.0/examples/capturing-picturepolyfill/index.html
){: target='_blank' }

Original polyfill example from Scott Jehl:

* [Original Picture Polyfill example (not using Capturing)](http://scottjehl.github.com/picturefill/){: target='_blank' }

## Capturing - Grumpy Cat

There is nothing more useful then replacing all 
the images of a page with grumpy cats! In a performant 
way of course ;-).

You can view the example in the link below. Be sure to
open up web inspector to see that the original images 
on the site did not download.

* [Grumpy Cat Example](http://cdn.mobify.com/mobifyjs/examples/capturing-grumpycat/index.html){: target='_blank' }

Source code on Github:

* [index.html](https://github.com/mobify/mobifyjs/blob/v2.0/examples/capturing-grumpycat/index.html){: target='_blank' }

## Capturing - Media Queries

In this example, we use media queries in attributes on images 
and scripts to determine which ones will load, just to give you 
an idea of what you can do with Capturing. 

You can view the example in the link below. Be sure to
open up web inspector to see that only the images and scripts
evaluated by the media query are loaded.

* [Media Query Example](http://cdn.mobify.com/mobifyjs/examples/capturing-mediaquery/index.html){: target='_blank' }

Source code on Github:

* [index.html](https://github.com/mobify/mobifyjs/blob/v2.0/examples/capturing-mediaquery/index.html){: target='_blank' }

## Capturing - Basic Templating

In this example, we use Templating to completely rewrite the original HTML
in this page, using Capturing to prevent any of the original resources from loading.

Check out the example (notice the CSS in the original markup does not
load):

* [Templating Example](http://cdn.mobify.com/mobifyjs/examples/capturing-basictemplating/index.html){: target='_blank' }

Source code on Github:

* [index.html](https://github.com/mobify/mobifyjs/blob/v2.0/examples/capturing-basictemplating/index.html){: target='_blank' }

----

## Where to Next?

If you want to understand more about how this stuff works, be sure to check out our 
[documentation](../docs/), read the [source code](https://github.com/mobify/mobifyjs), and if you have any questions, head over
to our [community](../community/) page.
