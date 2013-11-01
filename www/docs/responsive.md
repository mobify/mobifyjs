---
layout: doc
title: Going Responsive | Mobify.js Framework Documentation
---

# Going Responsive with Mobify.js

Mobify.js allows you to adapt a page's markup for mobile devices.
[Responsive Web Design](http://en.wikipedia.org/wiki/Responsive_Web_Design)
is similarly powerful technique for adapting a page for mobile.

We believe there's a time and a place for both. Responsive is great on
content-forward websites where you have full control over the original
markup. Mobify.js excels in situations where the original markup isn't
well-suited for mobile or can't be modified. Mobify.js also offers more
fine-grained control over UX and allows per-device performance
optimization.

But this doesn't need to be an either/or decision, you can use responsive
+ Mobify.js side by side and take advantage of the strengths of each.

## Combining Mobify.js with Responsive

If you're Mobify.js, working with responsive is simple. In your mobile
style sheet, add media queries as you normally would at your desired
breakpoints:

	@media (max-width: 320px) {
	  .selector {
	    rule: value;
	  }
	}
	@media (max-width: 480px) {
	  .selector {
	    rule: value;
	  }
	}

If you'd like to use Mobify.js to enhance an existing repsonsive site,
you'll likely want to forego a full mobile site adaptation. Instead
you can use the konf to cherry-pick more granular adaptations, and
ignore Mobify.js templates completely.

The first thing you'd do is configure your konf to pass through your
site's original DOM instead of adapting it:

	'OUTPUTHTML': function(context) {
	  return context.data('$html').prop('outerHTML')
	}

Then you would add single-element selectors on an as-needed basis:

    // remove an element on mobile devices
    $('.large-image').remove();

    // add content to an element
    $('.sale-item').append("<b>on sale</b>");

    // add a class for mobile
    $('.urgent').addClass("urgent-mobile");

    // move an element to another place in the mobile DOM
    $("footer li a:nth-child(3)").insertAfter($("header nav a:nth-child(2)"));
    $("#poll").appendTo($(".sidebar"));


So your final konf might look something like this:

	{>"/base/lib/base_konf.konf"/}
	{<data} {

	'adaptation': function() {
	  $('.large-image').remove();
	  $('.urgent').addClass("urgent-mobile");
	}

	'OUTPUTHTML': function(context) {
	  return context.data('$html').prop('outerHTML')
	}

	} {/data}

## Cloud Enhancements

The Mobify Cloud offers additional services that can enhance any
responsive site:

  * **Image Resizing** -- Our image resizing service automatically
    scales and resizes images, then serves only the most appropriate
    one for a user's device. It also enables the use of high-density
    (Retina) inline `img` elements without the performance hit of
    double-loading.

  * **Combo** -- our JavaScript optimization service. Combo improves
    your site's  JavaScript delivery for mobile and desktop alike.
    It combines HTTP requests for multiple scripts into a single request
    and caches the scripts client-side in HTML5 localStorage where
    available.

The Mobify Cloud base plan is free, [give it a try it now](https://cloud.mobify.com/).
