---
layout: doc
title: Using Combo for Intelligent Script Loading
---


# Using Combo for Intelligent Script Loading
 
Minimizing the number of HTTP requests made is a key technique in web page performance enhancement: Mobify provides a javascript API and web service to enable single-request loading of external javascript files.
 
Groups of external javascript files loaded using this API are downloaded with one HTTP request, which is cached for later re-use by our CDN. Additionally, the individual scripts are cached using HTML5 localStorage, so that they need not be redownloaded for use with subsequent pages that use a different grouping of scripts.
 
There are two means of using this functionality:
 
* `Mobify.$.fn.combineScripts()` removes from the DOM and rewrites all script members and script children of the jQuery collection it is called on, and returns a collection of script tags that will load all of the external scripts and run them in the original document order, when added to a Mobify template. Use this when scripts elements have dependencies on eachother.
* `Mobify.$.fn.combineScripts({async: true})` - removes from the DOM and rewrites all script members and script children of the jQuery collection it is called on and returns a collection of scripts that will load all of the external scripts and run them in an order of the browser's choosing. Use this when there are no dependencies between script elements (e.g. externally loaded asynchronous analytics scripts).

## Example

The following `konf` selection will produce a a tempalteable group of combined scripts:

    'scripts': function() {
    	$scripts = $('script').combineScripts();
    	return $scripts;
    }

We then template this selection like so:

	{scripts}