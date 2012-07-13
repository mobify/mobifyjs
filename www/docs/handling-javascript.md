---
layout: doc
title: Handling Javascript with Mobify.js
---

JavaScript is a powerful tool for adding dynamic functionality to
websites. Mobify.js treats \<script\> elements the same as other DOM
elements, so no special handling is needed. However, you will need to
pay attention to ordering and dependencies.

* * * * *

In this guide:

-   Default JavaScript behaviour
-   Understanding how JavaScript works
-   Dealing with Script DOM Errors
-   Advanced techniques for handling scripts
    -   Dealing with Script DOM Errors
    -   Including mobile specific scripts in your template
    -   Removing specific scripts

### Default JavaScript behaviour

The default Mobify project selects all scripts from the source DOM and
stores them under the key ‘script’:

        'script': function(cont) {
        return $('script').remove()
    }

Removing the elements from the source DOM ensures that they are not
accidently written out as part of another selection. Because ‘script’ is
not written out by default in the templates, *this has the effect of
removing all source JavaScript from the rendered page*.

If you would like to change the default behavior, read on!

### Understanding how JavaScript works

Web browsers execute JavaScript in DOM order. That is, the script
appearing first in the document is executed first, and subsequent
scripts are executed in the order they appear in the HTML.

Script ordering is important. Imagine a script that uses the `jQuery`
object to add a class to an element:

        <script>jQuery('html').addClass('js')</script>

If the `jQuery` object is not defined when the script executes, it will
cause an error:

        ReferenceError: `jQuery` is not defined

A script depends on another script if the other script must be executed
first. Our script depends on “jquery.js”:

        <script src="jquery.js"></script>
    <script>jQuery('html').addClass('js')</script>

To use scripts correctly, dependencies must be respected.

Now imagine a script that operates on a specific DOM element:

        <script>jQuery('#price').addClass('sale')</script>
    <div id="price">$19.99</div>

Because the element `#price` will only be added to the DOM after the
script runs, this code will fail to add the class.

To fix this, we must ensure `#price` is added to the DOM before the
script executes:

        <div id="price">$19.99</div>
    <script>jQuery('#price').addClass('sale')</script>

For scripts to execute correctly, they must be run after DOM elements
they depend on are added.

**To minimize the chance of breakage, ensure that scripts run at the
correct time, and maximize responsiveness, we recommend users include
all scripts in source DOM order at the bottom of a template.**

First select all script elements from the source DOM and store them
under the `script` key:

        'script': function(cont) {
        return $('script').remove();
    }

We then write out the contents of the `script` key as the last piece of
our template:

        {script}

Because jQuery returns selections in DOM order, and assuming that the
source site correctly obeys dependencies, using this technique, scripts
should ‘just work’.

To include this behaviour on every page, place your script selection in
a global key and write out its contents in your base template.

### Dealing with Script DOM Errors

Some JavaScript requires the existence of particular DOM elements to
execute. Imagine a script that increments the element returned by the
selector `#counter`:

        var counterEl = document.getElementById('counter');
    counterEl.innerHTML = parseInt(counterEl.innerHTML) + 1;

If the element matching the CSS selector \#counter does not exist in the
DOM at the time this script is executed, it will raise an error:

        TypeError: Cannot set property 'innerHTML' of null

This happens because `document.getElementById` returns `null`.

If you might exclude elements that a script rely on from your mobified
site, and it is possible to alter the contents of the script, we
recommend TRUNCATED! Please download pandoc if you want to convert large
files.