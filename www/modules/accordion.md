---
layout: modules
title: Mobify.js Accordion Module
---

<link rel="stylesheet" href="{{ site.baseurl }}/static/examples/css/accordion.css">
<link rel="stylesheet" href="{{ site.baseurl }}/static/examples/css/accordion-style.css">

# Accordion

An expanding accordion menu for two-level nav systems.

<ul class="m-accordion">
    <li class="m-item">
        <h3 class="m-header">
            <a>Tab1</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <h2>Content 1</h2>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui icia deserunt mollit anim id est laborum.</p>
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Tab2</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <h2>Content 2</h2>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p> 
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Tab3</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <h2>Content 3</h2>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui icia deserunt mollit anim id est laborum.</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui icia deserunt mollit anim id est laborum.</p>
            </div>
        </div>
    </li>
</ul>

<div class="btn-container actions">
	<a href="{{ site.baseurl }}/modules/accordion-examples" class="btn btn-primary">Download Accordion</a>
	<ul>
        <li><a href="{{ site.baseurl }}/modules/accordion-examples">See more examples</a></li>
	    <li><a href="http://jsfiddle.net/fPQma/3/">View it on jsFiddle</a></li>
    </ul>
</div>


## Usage

    <!-- include accordion.css -->
    <link rel="stylesheet" href="accordion.css">

    <!-- the markup -->
	<ul class="m-accordion">
	  <!-- the items -->
	  <li class="m-item">
	    <h3 class="m-header">
	      <!-- header title -->
	      <a>Tab1</a>
	    </h3>
        <div class="m-content">
          <div class="m-inner-content">
            <!-- content for item -->
            <h2>Content 1</h2>
            <h2>Lorem Ipsum</h2>
          </div>
        </div>
	  </li>
      <li class="m-item">
        <h3 class="m-header">
          <a>Tab2</a>
        </h3>
        <div class="m-content">
          <div class="m-inner-content">
            <h2>Content 2</h2>
            <p>Lorem Ipsum</p>
          </div>
        </div>
      </li>
	  <li class="m-item">
	    <h3 class="m-header">
	      <a>Tab3</a>
	    </h3>
	    <div class="m-content">
	      <div class="m-inner-content">
	        <h2>Content 3</h2>
	        <p>Lorem Ipsum</p>
	      </div>
	    </div>
	  </li>
	</ul>

    <!-- include zepto.js or jquery.js -->
    <script src="zepto.js"></script>
    <!-- include accordion.js -->
    <script src="accordion.js"></script>
    <!-- construct the accordion -->
    <script>$('.m-accordion').accordion()</script>

## Methods

### .accordion(options)

Initializes the accordion.

    $('.m-accordion').accordion();

### .accordion('unbind')

Removes any tap, mouse, and other event handlers from the accordion.

    $('.m-accordion').accordion('unbind');

### .accordion('bind')

Restores the tap, mouse, and other event handlers for the accordion.

    $('.m-accordion').accordion('bind');

### .accordion('destroy')

Unbinds the events from the accordion, and removes it from the DOM.

    $('.m-accordion').accordion('destroy');

## Browser Compatibility


| Browser           | Version | Support                    |
|-------------------|---------|----------------------------|
| Safari            | 4.0+    | Supported.                 |
| Firefox           | 3.5-3.6 | Degraded. No transitions.  |
| Firefox           | 4.0+    | Supported                  |
| Chrome            | 9.0+    | Supported                  |
| Opera             | 12.0+   | Supported.                 |
| Internet Explorer | 6-7.0   | Not Supported              |
| Internet Explorer | 8.0     | Degraded. No transitions.  |
| Internet Explorer | 9.0     | Degraded. No transitions.  |
| Internet Explorer | 10.0    | Supported                  |
| Mobile Safari     | 3.1.*   | Degraded. No transitions   |
| Mobile Safari     | 4.0+    | Supported                  |
| Android Browser   | 2.1+    | Supported                  |
| Chrome (Android)  | 1.0+    | Supported                  |
| Firefox (Android) | 1.0+    | Supported                  |
| Windows Phone     | 7.5     | Degraded. No transitions.  |

<script src="{{ site.baseurl }}/static/examples/js/accordion.js"></script>
<script>
    $(function() { $('.m-accordion').accordion(); });
</script>
