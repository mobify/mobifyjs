---
layout: modules
title: Mobify.js Carousel Module
---

<link rel="stylesheet" href="{{ site.baseurl }}/static/examples/css/carousel.css">
<link rel="stylesheet" href="{{ site.baseurl }}/static/examples/css/carousel-controls.css">
<style>

/* styling for this page */
.m-carousel {
  padding-bottom: 30px;
}
.m-item {
  margin-right: 20px;
}
.m-carousel .m-item img {
    margin: 0;
    padding: 0;
    max-width: none;
	width: 100%;
    -webkit-box-shadow: rgba(0,0,0,0.5) 0 5px 10px;
    -moz-box-shadow: rgba(0,0,0,0.5) 0 5px 10px;
    box-shadow: rgba(0,0,0,0.5) 0 5px 10px;
}
</style>

# Carousel

A configurable rotating content carousel module. Images and arbitrary 
content may be used.

<div class="m-carousel m-carousel-example-4 m-center m-fluid">
  <div class="m-carousel-inner">
    <div class="m-item">
        <img src="{{ site.baseurl }}/static/examples/img/blossoms.jpg">
    </div>
    <div class="m-item">
        <img src="{{ site.baseurl }}/static/examples/img/glacier.jpg">
    </div>
    <div class="m-item">
        <img src="{{ site.baseurl }}/static/examples/img/helmets.jpg">
    </div>
    <div class="m-item">
        <img src="{{ site.baseurl }}/static/examples/img/parliament.jpg">
    </div>
    <div class="m-item">
        <img src="{{ site.baseurl }}/static/examples/img/pods.jpg">
    </div>
  </div>
  <div class="m-carousel-controls m-carousel-bulleted">
    <a class="carousel-control right" href="#myCarousel" data-slide="1">1</a>
    <a class="carousel-control right" href="#myCarousel" data-slide="2">2</a>
    <a class="carousel-control right" href="#myCarousel" data-slide="3">3</a>
    <a class="carousel-control right" href="#myCarousel" data-slide="4">4</a>
    <a class="carousel-control right" href="#myCarousel" data-slide="5">5</a>
  </div>
</div>

<div class="btn-container">
	<a href="{{ site.baseurl }}/modules/carousel-examples" class="btn btn-primary">Download Carousel</a>
	<a href="{{ site.baseurl }}/modules/carousel-examples" class="see-examples">See more examples</a>
</div>

## Usage

    <!-- include carousel.css -->
    <link rel="stylesheet" href="carousel.css">

    <!-- the viewport -->
    <div class="m-carousel">
        <!-- the slider -->
        <div class="m-carousel-inner">
            <!-- the items -->
            <div class="m-item m-active">
                <img src="1.jpg">
            </div>
            <div class="m-item">
                <img src="2.jpg">
            </div>
            <div class="m-item">
                <img src="3.jpg">
            </div>
        </div>
        <div>
            <!-- use the `data-slide` attribute to create controls -->
            <a href="#" data-slide="prev">Previous</a>
            <a href="#" data-slide="1" class="m-active">1</a>
            <a href="#" data-slide="2">2</a>
            <a href="#" data-slide="3">3</a>
            <a href="#" data-slide="next">Next</a>
        </div>
    </div>

    <!-- include the JavaScript -->
    <script src="carousel.js"></script>
    <!-- construct the carousel -->
    <script>$('.m-carousel').carousel()</script>


## Classes

To control the styling of the carousel add the following classes to the
viewport:

| Class       | Description                                            |
|-------------|---------------------------------------------------------
| `.m-fluid`  | Causes the width of items to resize to match the viewport width. |
| `.m-center` | Causes the items to be center aligned, not left aligned (the default). | 

By default, the width of the items is determined by the content width
and/or by any styling that restricts its width.

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

Moves the carousel to a specific index (1-based).

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

## Compatability

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

<script src="{{ site.baseurl }}/static/examples/js/carousel.js"></script>
<script>$('.m-carousel').carousel();</script>