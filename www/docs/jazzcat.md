---
layout: doc
title: Speedy Scripts with Jazzcat | Mobify.js Framework Documentation
---

Jazzcat is a [Mobify Cloud](https://cloud.mobify.com/) feature. You
must be a Mobify Cloud user to use it with Mobify.js.

<a href="//cloud.mobify.com/" class="btn btn-primary rounded">Try Mobify Cloud for Free</a>

----

# Speedy Scripts with Jazzcat

Jazzcat improves script loading performance by enabling single request
loading of multiple JavaScript files.

Imagine a page loads three JavaScript files, _a.js_, _b.js_ and _c.js_:

    <script src="a.js"></script>
    <script src="b.js"></script>
    <script src="c.js"></script>

Jazzcat improves performance by loading all three files together in a
single request:

    <script src="//jazzcat.mobify.com/a.js,b.js,c.js"></script>
    <script>Mobify.jazzcat.load("a.js");</script>
    <script>Mobify.jazzcat.load("b.js");</script>
    <script>Mobify.jazzcat.load("c.js");</script>

----

## Usage

Mobify.js provides an API to format scripts for use with Jazzcat.
Inside your konf, use `$` to select the scripts that you would like to
use with Jazzcat and then format them using `combineScripts`:

    'scripts': function() {
        $scripts = $('script').combineScripts();
        return $scripts;
    }

Next write out the formatted scripts in a template. A good place is in
your _base.tmpl_ just before the `</body>`:

    <html>
    <head>...</head>
    <body>
        ...
        {scripts}
    </body>
    </html>

---

## Reference

### `$.fn.combineScripts()`

Searches the collection for script elements and and modifies the
external scripts to use the Jazzcat service. Returns all found scripts
in DOM order.