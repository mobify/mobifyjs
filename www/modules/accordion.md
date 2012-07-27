---
layout: modules
title: Mobify.js Carousel Module
---

<link rel="stylesheet" href="{{ site.baseurl }}/static/examples/css/accordion.css">

# Accordion

Try it out:

<ul class="m-accordion">
    <li class="item">
        <h3 class="header">
            <a>Tab1</a>
        </h3>
        <div class="content">
            <div class="inner-content">
                <h2>Content 1</h2>
                <h2>Lorem Ipsum</h2>
            </div>
        </div>
    </li>
    <li class="item">
        <h3 class="header">
            <a>Tab2</a>
        </h3>
        <div class="content">
            <div class="inner-content">
                <h2>Content 2</h2>
                <p>Lorem Ipsum</p>
            </div>
        </div>
    </li>
    <li class="item">
        <h3 class="header">
            <a>Tab3</a>
        </h3>
        <div class="content">
            <div class="inner-content">
                <h2>Content 3</h2>
                <p>Lorem Ipsum</p>
            </div>
        </div>
    </li>
</ul>

<script>


</script>

[See more examples]({{ site.baseurl }}/modules/accordion-examples)

## Using mobify-accordion.js

Call via JavaScript:

	$('.m-accordion').accordion()

## Markup

	<ul class="m-accordion">
	    <li class="item">
	        <h3 class="header">
	            <a>Tab1</a>
	        </h3>
	        <div class="content">
	            <div class="inner-content">
	                <h2>Content 1</h2>
	                <h2>Lorem Ipsum</h2>
	            </div>
	        </div>
	    </li>
	    <li class="item">
	        <h3 class="header">
	            <a>Tab2</a>
	        </h3>
	        <div class="content">
	            <div class="inner-content">
	                <h2>Content 2</h2>
	                <p>Lorem Ipsum</p>
	            </div>
	        </div>
	    </li>
	    <li class="item">
	        <h3 class="header">
	            <a>Tab3</a>
	        </h3>
	        <div class="content">
	            <div class="inner-content">
	                <h2>Content 3</h2>
	                <p>Lorem Ipsum</p>
	            </div>
	        </div>
	    </li>
	</ul>

## Methods

### `.accordion()`

Initializes the accordion.

### `.accordion('unbind')`

Unbind the events on the accordian object

### `.accordion('destroy')`

Destroys the accordion.

<script src="{{ site.baseurl }}/static/examples/js/accordion.js"></script>
<script>
    $(function() { $('.m-accordion').accordion(); });
</script>
