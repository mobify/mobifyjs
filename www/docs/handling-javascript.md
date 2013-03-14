---
layout: doc
title: Handling Javascript | Mobify.js Framework Documentation
---

# Handling JavaScript with Mobify.js

JavaScript is a powerful tool for adding dynamic functionality to
websites. Mobify.js treats \<script\> elements the same as other DOM
elements, so no special handling is needed. However, you will need to
pay attention to ordering and dependencies.

## Default JavaScript behaviour

The default Mobify project selects all scripts from the source DOM and
stores them under the key `script`:

    'script': function(cont) {
        return $('script').remove()
    }

Removing the elements from the source DOM ensures that they are not
accidently written out as part of another selection. Because `script` is
not written out by default in the templates, *this has the effect of
removing all source JavaScript from the rendered page*.

If you would like to change the default behavior, read on!

## Understanding how JavaScript works

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
first. Our script depends on _jquery.js_:

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
should just work.

To include this behaviour on every page, place your script selection in
a global key and write out its contents in your base template.

## Dealing with Script DOM Errors

Some JavaScript requires the existence of particular DOM elements to
execute. Imagine a script that increments the element returned by the
selector `#counter`:

    var counterEl = document.getElementById('counter');
    counterEl.innerHTML =
        parseInt(counterEl.innerHTML) + 1;

If the element matching the CSS selector \#counter does not exist in the
DOM at the time this script is executed, it will raise an error:

    TypeError: Cannot set property 'innerHTML' of null

This happens because `document.getElementById` returns `null`.

If you might exclude elements that a script rely on from your mobified
site, and it is possible to alter the contents of the script, we
recommend you update your scripts to fail gracefully in the event of
unexpected conditions. For example we could update our counter script to
the following:

    var counterEl = document.getElementById('counter');
    if (counterEl) {
        counterEl.innerHTML = parseInt(counterEl.innerHTML) + 1;
    }

If it is not possible to alter the script, we recommend adding the
required elements into your template before the script executes:

    <div style="display: none">
        <div id="counter"></div>
    </div>

Now the script won't cause an error!

Note that it may be possible to ignore script errors if their
functionality does not affect your transformation.

Advanced techniques for handling scripts
----------------------------------------

### Including mobile specific scripts in your template

By default the Dust.js templating engine doesn't preserve whitespace.
This is great for most HTML but problematic for things like scripts
where whitespace is significant, for example, with single line comments.
To avoid the issue, use the `{{ '{%' }}script}...{/script} ... {/script}` template pragma
instead of the `<script>` tag when working with inline scripts:

    <!-- BAD -->
    <script></script>

    <!-- GOOD -->
    {{ '{%' }}script}{/script}

Whitespace is correctly preserved inside the `{{ '{%' }}script}...{/script}` pragma and as a
bonus, the JavaScript is minified during deployment!

External scripts can be written in templates as normal:

    <script src="/path/to/script.js"></script>

Paths used inside your templates are resolved relative to the document's
domain, so if you'd like to reference a script from your Mobify project
use:

    <script src="{config.configDir}path/to/script.js"></script>

### Removing specific scripts

Sometimes it may be necessary to remove a specific script from the
mobified page. For example, you may want to remove a chat room script
provided by `chat.js` from your mobile website. To remove `chat.js`
script:

    'script': function() {
        var $script = $('script').remove();
        return $script.not('[x-src*="chat.js"]);
    }

We select all scripts from the source DOM and then store all scripts but
`chat.js` in the key `script`.

### Removing all scripts

To remove all scripts, remove them from the source DOM but do not render
them in the template:

    'script': function(cont) {
        return $('script').remove()
    }
