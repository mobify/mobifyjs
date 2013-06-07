---
layout: examplev2
title: Mobify.js Examples
---

# Examples

----

## Image Resizing - IMG

This example uses the [Image Resizer API](/mobifyjs/v2/docs/image-resizer/)
in Mobify.js to resize images to the width of the browser. The key thing to
note is that the markup is completely semantic (no use of special `data-`
attributes), yet through the use of Capturing, we are able to restrict the
page to only download the resized images.

* [Image Resizing](http://cdn.mobify.com/mobifyjs/examples/resizeImages-img-element/index.html){: target='_blank' }

The following markup:

    <div class="images">
        <img src="/mobifyjs/examples/assets/images/forest.jpg">
        <img src="/mobifyjs/examples/assets/images/mountains.jpg">
    </div>

is modified into this on the fly:

    <div class="images">
        <img src="//ir0.mobify.com/320/http://localhost:3000/mobifyjs/examples/assets/images/forest.jpg">
        <img src="//ir0.mobify.com/320/http://localhost:3000/mobifyjs/examples/assets/images/mountains.jpg">
    </div>

The original image assets do not download.

You can find the source code here:

* [index.html](https://github.com/mobify/mobifyjs/tree/v2.0/examples/resizeImages-img-element/index.html
){: target='_blank' }
* [main.js](https://github.com/mobify/mobifyjs/tree/v2.0/examples/resizeImages-img-element/main.js){: target='_blank' }

## Capturing - Picture Polyfill

The Picture element is the official W3C HTML extension for 
dealing with adaptive images. There are [polyfills that exist in 
order to use the Picture element in your site today](http://
scottjehl.github.com/picturefill/), but none of them are able to 
do a perfect polyfill - the best polyfill implemented thus far 
requires a `<noscript>` tag surrounding an `img` element in 
order to support browsers without Javascript. Using Capturing, 
you can avoid this madness completely.

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
* [main.js](https://github.com/mobify/mobifyjs/tree/v2.0/examples/capturing-picturepolyfill/main.js){: target='_blank' }

Original polyfill example:

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
* [main.js](https://github.com/mobify/mobifyjs/blob/v2.0/examples/capturing-grumpycat/index.html){: target='_blank' }

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
* [main.js](https://github.com/mobify/mobifyjs/blob/v2.0/examples/capturing-mediaquery/main.js){: target='_blank' }

## Capturing - Basic Templating

The primary function of Mobify.js 1.1 was client-side templating 
to completely rewrite the pages of your existing site when
responsive doesn't offer enough flexibility, or when changing 
the backend is simply too painful and tedious. It is 
particularly helpful when you need a mobile presence fast. This 
is no longer the primary function of Mobify.js, but it is still 
possible. 

Check out this basic example:

* [Templating Example](http://cdn.mobify.com/mobifyjs/examples/capturing-basictemplating/index.html){: target='_blank' }

Source code on Github:

* [index.html](https://github.com/mobify/mobifyjs/blob/v2.0/examples/capturing-basictemplating/index.html){: target='_blank' }
* [base.html](https://github.com/mobify/mobifyjs/blob/v2.0/examples/capturing-basictemplating/main.js){: target='_blank' }

----

## Where to Next?

If you want to understand more about how this stuff works, be sure to check out our 
[documentation](../docs/), read the [source code](https://github.com/mobify/mobifyjs), and if you have any questions, head over
to our [community](../community/) page.
