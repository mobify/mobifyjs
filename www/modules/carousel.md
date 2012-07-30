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

Image carousel module for all your image rotating needs. Try it out:

<div class="m-carousel m-carousel-example-4 m-center m-fluid">
  <!-- Carousel items -->
  <div class="m-carousel-inner">
    <div class="m-item">
        <img src="{{ site.baseurl }}/static/examples/img/helmets.jpg">
    </div>
    <div class="m-item">
        <img src="{{ site.baseurl }}/static/examples/img/blossoms.jpg">
    </div>
    <div class="m-item">
        <img src="{{ site.baseurl }}/static/examples/img/glacier.jpg">
    </div>
    <div class="m-item">
        <img src="{{ site.baseurl }}/static/examples/img/parliament.jpg">
    </div>
    <div class="m-item">
        <img src="{{ site.baseurl }}/static/examples/img/pods.jpg">
    </div>
  </div>
  <!-- Carousel controls -->
  <div class="m-carousel-controls m-carousel-bulleted">
    <a class="carousel-control right" href="#myCarousel" data-slide="1">1</a>
    <a class="carousel-control right" href="#myCarousel" data-slide="2">2</a>
    <a class="carousel-control right" href="#myCarousel" data-slide="3">3</a>
    <a class="carousel-control right" href="#myCarousel" data-slide="4">4</a>
    <a class="carousel-control right" href="#myCarousel" data-slide="5">5</a>
  </div>
</div>


[See more examples]({{ site.baseurl }}/modules/carousel-examples)

## Using mobify-carousel.js

{to be written}

<script src="{{ site.baseurl }}/static/examples/js/carousel.js"></script>
<script>
    $(function() { $('.m-carousel').carousel(); });
</script>
