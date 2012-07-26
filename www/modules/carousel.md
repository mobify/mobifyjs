---
layout: modules
title: Mobify.js Carousel Module
---

# Carousel

Image carousel module for all your image rotating needs. Try it out:

![Example](/mobifyjs/static/img/glyphicons-halflings-white.png)

[See more examples]({{ site.baseurl }}/modules/carousel-examples)

## Using mobify-carousel.js

Call via JavaScript:

	$('.carousel').carousel()

## Options

<table>
	<tr>
		<th scope="col">Name</th>
		<th scope="col">type</th>
		<th scope="col">default</th>
		<th scope="col">description</th>
	</tr>
	<tr>
		<td>interval</td>
		<td>number</td>
		<td>5000</td>
		<td>The amount of time to delay between automatically cycling an item. If false, carousel will not automatically cycle.</td>
	</tr>
	<tr>
		<td>pause</td>
		<td>string</td>
		<td>"hover"</td>
		<td>Pauses the cycling of the carousel on <code>mouseenter</code> and resumes the cycling of the carousel on <code>mouseleave</code>.</td>
	</tr>
</table>

## Markup

Data attributes are used for the previous and next conrols. Check out the example markup below.

	<div id="myCarousel" class="carousel slide">
	  <!-- Carousel items -->
	  <div class="carousel-inner">
	    <div class="active item">...</div>
	    <div class="item">...</div>
	    <div class="item">...</div>
	  </div>
	  <!-- Carousel nav -->
	  <a class="carousel-control left" href="#myCarousel" data-slide="prev">&lsaquo;</a>
	  <a class="carousel-control right" href="#myCarousel" data-slide="next">&rsaquo;</a>
	</div>

## Methods

### `.carousel(options)`

Initializes the carousel with an optional options object and starts cycling through items.

	$('.carousel').carousel({
	  interval: 2000
	})

### `.carousel('cycle')`

Cycles through the carousel items from left to right.

### `.carousel('pause')`

Stops the carousel from cycling through items.

### `.carousel(number)`

Cycles the carousel to a particular frame (0 based, similar to an array).

### `.carousel('prev')`

Cycles to the previous item.

### `.carousel('next')`

Cycles to the next item.

## Events

Bootstrap's carousel class exposes two events for hooking into carousel functionality.

<table>
	<tr>
		<th scope="col">Event</th>
		<th scope="col">Description</th>
	</tr>
	<tr>
		<td>slide</td>
		<td>This event fires immediately when the slide instance method is invoked.</td>
	</tr>
		<td>slid</td>
		<td>This event is fired when the carousel has completed its slide transition.</td>
	</tr>
</table>
