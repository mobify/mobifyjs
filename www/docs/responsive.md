---
layout: doc
title: Going Responsive
---

# Going Responsive with Mobify.js

Mobify.js is a way of adapting a page's markup for mobile devices. [Responsive Web Design](http://en.wikipedia.org/wiki/Responsive_Web_Design) is similarly powerful technique for adapting a page for mobile.

We believe there's a time and a place for both. Mobify.js excels in situations where the original markup isn't well-suited for mobile. 

to do: talk about combining the two



## Combining Mobify.js with Responsive

to do: 

* Altering an existing site's markup to make it more responsive friendly
* re-arrange ordering in your DOM, remove, alter properties

.

	'OUTPUTHTML': function(context) {
	    return context.data('$html').prop('outerHTML')
	}


## Responsive UI Modules

We're building a library of UI modules that will work with Mobify.js to help you create mobile sites faster. These modules will be fully responsive, and will easily integrate into new and existing sites alike.

Stay tuned as we release the first handful of these during August 2012.


## Cloud Enhancements

The Mobify Cloud offers additional services that can enhance any responsive site:

* **Image Resizing** -- Our image resizing service automatically scales and resizes images, then serves only the most appropriate one for a user's device. It also enables the use of high-density (Retina) inline `img` elements without the performance hit of double-loading.
* **Combo** -- our JavaScript optimization service. Combo improves your site's  JavaScript delivery for mobile and desktop alike. It combines HTTP requests for multiple scripts into a single request and caches the scripts client-side in HTML5 localStorage where available.

The Mobify Cloud base plan is free, [give it a try it now](https://cloud.mobify.com/).
