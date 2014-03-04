---
layout: doc
title: Konf Reference | Mobify.js Framework Documentation
---

# Konf Reference

 - TOC
{:toc}

##  `$(selector)`

Inside the `{<konf} ... {/konf}` block, `$` references the
[Zepto](http://zeptojs.com/) object. Its context is bound to the source DOM
document.

**Differences from the Regular DOM**

Inside the source DOM, attributes on elements that would cause resource
fetching are prefixed with `x-`.

| Tag     | Prefixed Attributes |
|---------|---------------------|
| img     | src, width, height  |
| iframe  | src                 |
| script  | src, type           |
| link    | href                |
| style   | media               |


    // WRONG!!! No results in the source DOM.
    $('img[src]')

    // RIGHT!!! Search using the prefixed attribute.
    $('img[x-src]')

    // WRONG!!! Undefined in the source DOM.
    $('img').attr('src')

    // RIGHT!!! Retrieve the prefixed attribute.
    $('img').attr('x-src')

For rendering, all prefixes are removed except for `img[x-width]` and
`img[x-height]`.

##  `OUTPUTHTML`

Is a special key in the konf. Any string assigned to it will be
rendered immediately as the output of the page. For this reason,
it should **always** be declared as the last key of the konf
object:

    'OUTPUTHTML': function() {
        return '<html><body><h1>HELLO MOBIFY!</h1></body></html>';
    }

If a falsey value is assigned to _OUTPUTHTML_, the original page
will be rendered.


##  `context.data(key)`

Returns the value of a previously assigned key.  The konf is evaluated
from top to bottom, so it is possible to access the value of previously
assigned keys. For example you may wish to reuse a selection made for the
_content_ within _footer_.

    'content': function() {
        return $('.page-content');
    },
    'footer': function(context) {
        return context.data('content');
    }

This assigns the value of the _content_ key to _footer_.

**Variable Resolution**

`context.data` returns the matching key at the closest level. If
the key is not found at the current level, it ascends to the parent
level and tries again.


##  `context.tmpl(templateName)`

Returns the matching _.tmpl_ file rendered against the evaluated konf.

    'OUTPUTHTML': function(context) {
        return context.tmpl('home');
    }

By default, all _.tmpl_ files in the project's _tmpl/_ folder are
available to `context.tmpl`.

A common pattern is to assign a template name to a key in the konf and
later look it up with `context.data`. The template name can then be
passed to `context.tmpl` for output with _OUTPUTHTML_:

    'templateName': 'home',
    'OUTPUTHTML': function(context) {
        var template = context.data('template');
        return context.tmpl(template);
    }

This assigns the value `"home"` to the templateName key. `context.data`
looks up the value and passes it to `context.tmpl` which finds the matching
template and renders it. The result is then output to the browser!


##  `context.choose(obj1[, obj2[, ...]])` {#context-choose}

Accepts a variable number of objects as arguments and executes the
first one that matches. It is useful for making specific selections based
on the page being currently rendered.

An argument is said to match if all required keys, that is keys that
start with `!`, evaluate to truthy values:

    'content': function(context) {
        return context.choose({
            '!home': function() {
                return $('#product-carousel');
            }
        }, {
            '!products': function() {
                return $('.product-listing');
            }
        })
    }

In this example, the first argument matches if the function assigned
to the _!home_ evaluates to a truthy value. If it doesn't, the next
argument would be tested.

An argument with no required keys always matches:

    'content': function(context) {
        return context.choose({
            'home': function() {
                return $('#product-carousel');
            }
        })
    }

If no matching arguments are found `context.choose` returns `undefined`.

Multiple required keys can be used to create "and" conditions:

    'home': function(context) {
        return context.choose({
            'templateName': 'homePage',
            '!productCarousel': function() {
                return $('#product-carousel');
            },
            '!saleItems': function() {
                return $('.sale-items');
            }
        },
    }

In this case the argument will only match if both _productCarousel_ and
_saleItems_ are truthy.

A common pattern in the konf is to use `context.choose` to select
template specific content and assign a key which will later be used as
the template name:

    'content': function(context) {
        return context.choose({
            'templateName': 'home',
            '!home': function() {
                return $('#product-carousel');
            }
        }, {
            'template': 'saleItems',
            '!item': function() {
                return $('.sale-items');
            }
        })
    },
    'OUTPUTHTML': function(context) {
        var template = context.data('content.templateName');
        if (template) {
            return context.tmpl(template);
        }
    }


### Truthiness Of Required Selections, Keys Prefixed With `!`

`context.choose` considers a value to be truthy if it matches one of
the following conditions:

    obj.length && obj.length > 0
    obj == true

If none of these conditions are true then a value is considered
falsey.

### Do not change the DOM in required selections {#do-not-modify-dom-in-required}

All required keys in any argument may be evaluated. Non-required keys
are only evaluated if the argument is matched. If the DOM is altered in
a required key, it may affect evaluation later in the konf leading to
difficult to debug errors. Do not alter the DOM in required keys. Move
DOM altering operations to non-required keys.

### Matching URLs with Mobify.urlmatch()

Mobify.js provides the `Mobify.urlmatch()` function as a convenient method of
making matches based on patterns in the path portion of the URL.

It takes as an argument a string containing a
[path expression](../matching-to-urls#path-expressions), or a JavaScript
`RegExp` object, and returns a function that will match the expression against
`window.location.pathname`.

The returned function takes no arguments, and will return a regular expression
object when it matches, and false otherwise.

See the document [Matching Templates to URLs](../matching-to-urls) for further
reference.

##  Reserved Keys

The konf is extended by a default konf containing the following reserved
keys:

`!__match`
: A template matching function, used by Mobify Studio

`__url`

: A template's prototype page url, used by Mobify Studio

`$html`
: Reference to the source DOM `<html>` element

`$head`
: Reference to the source DOM `<head>` element

`$body`
: Reference to the source DOM `<body>` element

`buildDate`
: The date this _mobify.js_ file was built

`config.configDir`
: Path to the directory from which _mobify.js_ loaded

`config.configFile`
: Path to _mobify.js_

`config.HD`
: A boolean flag that will be true if this device has a high density display

`config.isDebug`
: A boolean flag that will be true if Mobify.js is running in debug mode

`config.orientation`
: A string that will be "portrait" if the device is taller than it is wide, or
"landscape" if it is wider than it is tall

`config.os`
: A string representing the detected operating system of the device

`config.path`
: A string representing the path from where the mobify.js file was loaded

`config.started`
: An internal flag used to record whether the page has been adapted

`config.tagVersion`
: Version of the Mobify tag used on this site

`config.touch`
: A boolean flag that will be true if touch events are supported, false
otherwise

`configName`
: A property pulled from _project.json_ - most likely the unique identifier for
your site

`cssName`
: A function returning the name of the css file to be applied

`imageDir`
: A function returning a path to where mobify adaptation specific images are
kept

`mobileViewport`
: Contents of the viewport meta tag to be sent

`siteConfig`
: An object containing analytics configuration information

`touchIcon`
: The location of a file to be used as the bookmark icon for this website on iOS
devices

`unmobify`
: An internal flag used to record whether the page has been unmobified

##  Best Practices

* DO: Prefer the matching of more complete DOM outlines over single
      selectors when assigning templates to specific pages.

* DO NOT: [Alter the source DOM in required selectors](#do-not-modify-dom-in-required)
