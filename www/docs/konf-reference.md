---
layout: doc
title: Konf Reference 
---

# Konf Reference

 - TOC
{:toc}

##  Using the Konf

The konf is a JavaScript file required by every Mobify.js project.
It contains DOM operations that select elements from the source
DOM to be rendered in the adaptation. To make selection easy Mobify.js 
includes [Zepto](http://zeptojs.com/), a JavaScript DOM library 
optimized for mobile with a jQuery-like API. 

A selection to assign the site's logo to a key might look like this:

    'logo': function() {
        return $('.identity img');
    },

Note that the corresponding page template must include a reference to
the key _logo_ for it to render.

The konf can be used to make page specific selections:

    return context.choose(
    {
        'templateName': 'homePage'
      , '!products': function() {
            return $('#product-carousel');
        }
    }, {
        'templateName': 'productPage'
      , '!class': function() {
            return $('.product-list');
        }
    }

The first selector will search the source DOM for an element with 
the id of `product-carousel`. If the element is found, the required
key _products_ will be set to a truthy value, and the _homePage.tmpl_
will be selected. If not, then (and only then) the second selector 
is evaluated and if an element with a `product-list` class is found, 
the page will instead be rendered with _productPage.tmpl_. See [here
for more on how `context.choose` works](#context-choose).

Only templates with required keys that evaluate to truthy values will 
render, and when multiple templates could potentially apply only the 
first matching template will be chosen for the page.

Template mapping is accomplished through DOM matching.

For example, instead of simply defining templates this way:

    'homePage': 'home.tmpl'

You would instead find unique selectors that only apply on the page 
you want to render with a template, then assign that template using 
`context.choose`:

    return context.choose({
        'templateName': 'homePage',
        '!class': function() {
            return $('body.home-page');
        },
    }        

Single selectors as above are easy enough, but we recommend instead 
describing (via selections) the ideal DOM including all elements on 
the page that you will adapt for your mobile site. Then assign a 
template to that desired DOM:

    return context.choose({
        'templateName': 'homePage',
        '!productCarousel': function() {
            return $('.product-carousel');
        },
        '!saleItems': function() {
            return $('.sale-items');
        },
        '!customerService': function() {
            return $('.customer-service');
        }
    },

Why do it this more verbose way? We believe the most robust method of 
selecting content for your mobile site is by describing the overall 
makeup of the page rather than having your selectors rely too heavily 
on any one specific class or id.

We all know that websites change. When your source DOM becomes even 
superficially different from when you developed your mobile site, 
there's a chance that your once-valid selections will stop matching 
and your mobile users will experience missing content or blank pages. 

With the above example, what happens when the sale ends? Sales items 
removed from the DOM mean the required `saleItems` key no longer 
returns a truthy result. Mobify.js has a choice in this situation - 
it could either stop rendering required items, or fall back to the 
desktop site. Since `productCarousel` and `customerService` are also 
required, they would not render at all if we were to choose the former 
approach.

On the chance that `productCarousel`, `customerService` or any other 
required selections make up the bulk of your home page content, we 
think it's far better to fall back to the desktop site. This approach 
will continue to provide your users with content instead of serving 
them a mostly empty mobile site.


##  `OUTPUTHTML`
    
Is a special key in the konf. Any string assigned to it will be 
rendered immediately as the output of the page. For this reason, 
it should **always** be declared as the very last key of the konf 
object:

    'OUTPUTHTML': function() {
        return '<html><body><h1>HELLO MOBIFY!</h1></body></html>';
    }


##  `context.data(key)`

Returns the value of a previously-assigned key.  The konf is evaluated 
from top to bottom, so it is possible to access previous keys in later 
assignments. For example you may wish to reuse a selection made for the 
_content_ within _footer_. 

    'content': function() {
        return $('.page-content');
    },
    'footer': function(context) {
        return context.data('content');
    }

This passes to _footer_ the value of the _content_ key, which is in 
turn the evaluated return of `$('.page-content')`.

**Variable Resolution**

`context.data(key)` returns the matching key at the closest level. If 
the key is not found at the current level, it ascends to the parent 
level and tries again. 


##  `context.tmpl(templateName)`

Returns the matching _.tmpl_ file rendered against the evaluated konf.

    'OUTPUTHTML': function(context) {
        return context.tmpl('home');
    }

This renders the _home.tmpl_ using the _OUTPUTHTML_ key. By default, 
all _.tmpl_ files in the project's _tmpl/_ folder are available to the 
`context.tmpl` function.

A common pattern is to conditionally assign template names to a 
specific key in the konf, access the key with `context.data`, then use 
`context.tmpl` to render the selected template using _OUTPUTHTML_:

    'template': 'home',
    'OUTPUTHTML': function(context) {
        var template = context.data('template');
        return context.tmpl(template);
    }

This assigns a value of `home` to the key later referenced by 
`context.data`. The returned value is passed to _context.tmpl_ as a 
template name, which is returned to `OUTPUTHTML` for rendering.


##  `context.choose(obj1[, obj2[, ...]])` {#context-choose}

Accepts a variable number of objects as arguments and executes the
first one that matches. An argument is considered to match if its
keys starting with `!` all evaluate to a truthy values:

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
to the key `!home` evalutes to a truthy value. If it doesn't, it would
be considered to not matching and the next argument would be tested.
Only the first matching argument is executed.

An argument with no required keys always matches:

    'content': function(context) {
        return context.choose({
            'home': function() {
                return $('#product-carousel');
            }
        })
    }

If no matching arguments are found `context.choose` returns undefined. 

Multiple keys may be prefixed with `!` to create "and" conditions: 

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

In this case only if both productCarousel_ and _saleItems_ evaluate
to truthy values will the argument match and _templateName_ be assigned.

A common pattern in a konf is to use `context.choose` to select 
template specific content and set a key which will be used as the 
template name:

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

`context.choose` considers a selection to be truthy if it matches 
one of the following conditions:

    obj.length && obj.length > 0
    obj == true

If none of these conditions are true then a value is considered 
falsey.

### Do not change the DOM in required selections {#do-not-modify-dom-in-required}

All required keys in any block may be evaluated, while non-required
keys are only evaluated if the argument is matched. If you made modifications
to the DOM, you may adversely affect evaluation further down the konf. 
This often leads to hard to find bugs. It is recommended you select for 
certain elements in required keys, but if the DOM requires modification, 
do it in a non-required key.

##  Reserved Keys

The konf is extended by a default konf containing the following reserved
keys:

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
: A string that will be "portrait" if the device is taller than it is wide, or "landscape" if it is wider than it is tall

`config.os`
: A string representing the detected operating system of the device

`config.path`
: A string representing the path from where the mobify.js file was loaded

`config.started`
: An internal flag used to record whether the page has been adapted

`config.tagVersion`
: Version of the Mobify tag used on this site

`config.touch`
: A boolean flag that will be true if touch events are supported, false otherwise

`configName`
: A property pulled from _project.json_ - most likely the unique identifier for your site

`cssName`
: A function returning the name of the css file to be applied

`imageDir`
: A function returning a path to where mobify adaptation specific images are kept

`mobileViewport`
: Contents of the meta viewport tag to be sent

`siteConfig`
: An object containing analytics configuration information

`touchIcon`
: The location of a file to be used as the bookmark icon for this website on iOS devices

`unmobify`
: An internal flag used to record whether the page has been unmobified

##  Best Practices

* DO: Prefer the matching of more complete DOM outlines over single 
      selectors when assigning templates to specific pages.

* DO NOT: [Alter the source DOM in required selectors](#do-not-modify-dom-in-required)
