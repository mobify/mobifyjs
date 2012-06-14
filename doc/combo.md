# Using Combo for Intelligent Script Loading

Mobify provides a javascript API and web service to provide optimized loading of external javascript files.

Minimizing the number of HTTP requests made is a key technique in web page performance enhancement.

Groups of external javascript files loaded using this API are downloaded in a single HTTP request, which is cached for later re-use by our CDN. Additionally, the individual scripts are cached in HTML5 localStorage, so that they need not be redownloaded for use with subsequent pages that use a different grouping of scripts.

There are two functions provided for making use of this:

* `Mobify.$.fn.comboScriptSync()` removes from the DOM and rewrites all script members and script children of the jQuery collection it is called on, and returns a collection of script tags that will load all of the external scripts and run them in the original document order, when added to a Mobify template. Use this when scripts elements have dependencies on eachother.
* `Mobify.$.fn.comboScriptAsync()` - removes from the DOM and rewrites all script members and script children of the jQuery collection it is called on and returns a collection of scripts that will load all of the external scripts and run them in an order of the browser's choosing. Use this when there are no dependencies betweens cript elements (e.g. externally loaded asynchronous analytics scripts).