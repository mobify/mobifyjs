---
layout: modules
title: Mobify.js Carousel Module for Mobile Websites
description:
    Learn about Mobify.js Carousel module, a configurable rotating content
    carousel for displaying images or arbitrary information on mobile websites.
---

<link rel="stylesheet" href="{{ site.baseurl }}/static/modules/carousel/carousel.css">
<link rel="stylesheet" href="{{ site.baseurl }}/static/modules/carousel/carousel-style.css">
<style>

/* styling for this page */
.m-carousel {
  padding-bottom: 30px;
}
</style>

# Carousel

A configurable rotating content carousel for displaying images or
arbitrary content.

<div class="m-carousel m-fluid m-carousel-photos" id="m-carousel-example-4">
    <div class="m-carousel-inner">
        <div class="m-item">
            <img src="{{ site.baseurl }}/static/img/modules/blossoms.jpg">
        </div>
        <div class="m-item">
            <img src="{{ site.baseurl }}/static/img/modules/glacier.jpg">
        </div>
        <div class="m-item">
            <img src="{{ site.baseurl }}/static/img/modules/helmets.jpg">
        </div>
        <div class="m-item">
            <img src="{{ site.baseurl }}/static/img/modules/parliament.jpg">
        </div>
        <div class="m-item">
            <img src="{{ site.baseurl }}/static/img/modules/pods.jpg">
        </div>
    </div>
    <div class="m-carousel-controls m-carousel-bulleted">
        <a href="#" data-slide="1">1</a>
        <a href="#" data-slide="2">2</a>
        <a href="#" data-slide="3">3</a>
        <a href="#" data-slide="4">4</a>
        <a href="#" data-slide="5">5</a>
    </div>
</div>

<div class="btn-container">
	<a href="{{ site.baseurl }}/static/downloads/carousel.zip" class="btn btn-primary">Download Carousel</a>
	<a href="{{ site.baseurl }}/modules/carousel-examples" class="see-examples">See more examples</a>
</div>

## Usage

    <!-- include carousel.css -->
    <link rel="stylesheet" href="carousel.css">
    <link rel="stylesheet" href="carousel-style.css">

    <!-- the viewport -->
    <div class="m-carousel m-fluid m-carousel-photos">
      <!-- the slider -->
      <div class="m-carousel-inner">
        <!-- the items -->
        <div class="m-item m-active">
          <img src="image1.jpg">
        </div>
        <div class="m-item">
          <img src="image2.jpg">
        </div>
        <div class="m-item">
          <img src="image3.jpg">
        </div>
      </div>
      <!-- the controls -->
      <div class="m-carousel-controls m-carousel-bulleted">
        <a href="#" data-slide="prev">Previous</a>
        <a href="#" data-slide="1" class="m-active">1</a>
        <a href="#" data-slide="2">2</a>
        <a href="#" data-slide="3">3</a>
        <a href="#" data-slide="next">Next</a>
      </div>
    </div>

    <!-- include zepto.js or jquery.js -->
    <script src="zepto.js"></script>
    <!-- include carousel.js -->
    <script src="carousel.js"></script>
    <!-- construct the carousel -->
    <script>$('.m-carousel').carousel()</script>


## Classes

By default, items are center aligned and their width is determined by
their content width and/or any styling that restricts their width.

To change the styling of the items, add the following classes to the
viewport:


| Class       | Description                                            |
|-------------|---------------------------------------------------------
| `.m-fluid`  | Causes the width of items to resize to match the viewport width. |
| `.m-center` | Causes the items to be center aligned, not left aligned (the default). |




## Methods

### .carousel(options)

Constructs the carousel with options.

    $('.m-carousel').carousel({
          dragRadius: 10
        , moveRadius: 20
        , classPrefix: undefined
        , classNames: {
            outer: "carousel"
          , inner: "carousel-inner"
          , item: "item"
          , center: "center"
          , touch: "has-touch"
          , dragging: "dragging"
          , active: "active"
        }
    });

### .carousel('next')

Moves the carousel one item to the right.

    $('.m-carousel').carousel('next');

### .carousel('prev')

Moves the carousel one item to the left.

    $('.m-carousel').carousel('prev');

### .carousel('move', x)

Moves the carousel to a index `x` (1-based).

    $('.m-carousel').carousel('move', 1);

### .carousel('unbind')

Removes event handlers bound on the carousel.

    $('.m-carousel').carousel('unbind');

### .carousel('bind')

Binds the event handlers on the carousel.

    $('.m-carousel').carousel('bind');

### .carousel('destroy')

Removes the carousel and its event handlers from the DOM.

    $('.m-carousel').carousel('destroy');


## Events

The viewport emits the following events:

| Name          | Arguments                 | Description                               |
|---------------|---------------------------|-------------------------------------------|
| beforeSlide   | previousIndex, newIndex   | Fired before the carousel moves.          |
| afterSlide    | previousIndex, newIndex   | Fired after the carousel begins moving.   |

## Browser Compatibility

### Mobile Browsers

The following mobile browsers are fully supported:

| Browser           | Version |
|-------------------|---------|
| Mobile Safari     | 3.1.3+  |
| Android Browser   | 2.1+    |
| Android Chrome    | 1.0+    |
| Android Firefox   | 1.0+    |

The following mobile browsers have degraded support:

| Browser           | Version |
|-------------------|---------|
| Windows Phone     | 7.5     |

### Desktop Browsers

The follow desktop browsers are fully supported:

| Browser           | Version |
|-------------------|---------|
| Safari            | 4.0+    |
| Firefox           | 4.0+    |
| Chrome            | 12.0+   |
| Opera             | 12.0+   |
| Internet Explorer | 10.0+   |

The following desktop browsers have degraded support:

| Browser           | Version |
|-------------------|---------|
| Internet Explorer | 8.0,9.0 |
| Firefox           | 3.5,3.6 |


<!--

| Browser           | Version | Support               |
|-------------------|---------|-----------------------|
| Safari            | 4.0+    | Supported.            |
| Firefox           | 3.5-3.6 | Degraded. No transitions between images. |
| Firefox           | 4.0+    | Supported             |
| Chrome            | 12.0+   | Supported             |
| Opera             | 12.0+   | Supported. Some styles have visual errors. |
| Internet Explorer | 6-7.0   | Not Supported         |
| Internet Explorer | 8.0     | Degraded. No transitions. No dragging. Next/Previous must be provided. |
| Internet Explorer | 9.0     | Degraded. No transitions. |
| Internet Explorer | 10.0    | Supported             |
| Mobile Safari     | 3.1.3+  | Supported             |
| Android Browser   | 2.1+    | Supported             |
| Chrome (Android)  | 1.0+    | Supported             |
| Firefox (Android) | 1.0+    | Supported             |
| Windows Phone     | 7.5     | Degraded. No transitions. No touch (dragging). Next/Previous must be provided. |

-->

<script src="{{ site.baseurl }}/static/modules/carousel/carousel.js"></script>
<script>$('.m-carousel').carousel();</script>
