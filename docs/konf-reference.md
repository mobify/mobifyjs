---
layout: doc
title: Konf Reference 
---

# Konf Reference

1. Using Konf
2. OUTPUTHTML
3. context.data
4. context.tmpl
5. context.choose
6. Reserved Keys
7. Best Practices


## 1\. Using Konf

The Mobify.js konf selects elements from the source DOM to be rendered on the mobile site. To make selection easy, mobify.js includes Zepto.js, a minimalist JavaScript selector library optimized for mobile with a jQuery-compatible API. 

A simple selector to assign the site's logo to a key might look like this:

    'logo': function() {
        return $('.identity img')
    },

This key will apply to every page where the selector evaluates to true. Note that the corresponding page template needs to include a variable that references the key for it to render.

The konf is also used to determine which templates will render for each page by evaluating jQuery-like selectors against the current page:

    return context.choose({
        'templateName': 'homePage',
        '!products': function() {
            return $('#product-carousel')
        }
    }, {
        'templateName': 'productPage',
        '!class': function() {
            return $('.product-list')
        },
    }

The first selector will search the current page for an element with the id of `product-carousel`. If it finds it, the required key `products` evaluates to true and the page will immediately be rendered with _homePage.tmpl_. If not, then (and only then) the second selector is evaluated and if an element with a `product-list` class is found, the page will instead be rendered with _productPage.tmpl_. See below for more on how `context.choose` works.

Only templates with conditions that evaluate to true will render, and when multiple templates could potentially apply only the first matching template will be chosen for the page.

Template mapping is accomplished indirectly through DOM matching, note that there is no direct way to select a template for a specific page on your site. 

For example, instead of simply defining templates this way:

    'homePage': 'home.tmpl'

You would instead find unique selectors that only apply on the page you want to render a template, then assign that template using `context.choose`:

    return context.choose({
        'templateName': 'homePage',
        '!class': function() {
            return $('body.home-page')
        },
    }        

Single selectors as above are easy enough, but we recommend instead describing (via selections) the ideal DOM including all elements on the page that you will adapt for your mobile site. Then assign a template to that desired DOM:

    return context.choose({
        'templateName': 'homePage',
        '!productCarousel': function() {
            return $('.product-carousel')
        },
        '!saleItems': function() {
            return $('.sale-items')
        },
        '!customerService': function() {
            return $('.customer-service')
        }
    },

Why do it this more verbose way? We believe the most robust method of selecting content for your mobile site is by describing the overall makeup of the page rather than having your selectors rely too heavily on any one specific class or id.

We all know that websites change. When your source DOM becomes even superficially different from when you developed your mobile site, there's a chance that your once-valid selections will stop matching and your mobile users will experience blank pages. 

With the above example, what happens when the sale ends? Sales items removed from the DOM mean the required `saleItems` key no longer returns a valid result. Mobify.js has a choice in this situation - it could either stop rendering required items, or fall back to the desktop site. Since `productCarousel` and `customerService` are also required, they would not render at all if we were to choose the former approach.

On the chance that `productCarousel`, `customerService` or any other required selections make up the bulk of your home page content, we think it's far better to fall back to the desktop site. This approach will continue to provide your users with content instead of serving them a mostly empty mobile site.


## 2\. `OUTPUTHTML`
    
`OUTPUTHTML` is a special key of the konf object. Any string it returns will be rendered immediately as the output of the page. For this reason, it should **always** be declared as the very last key of the konf object:

    'OUTPUTHTML': function(context) {
        return '<html><body><h1>HELLO MOBIFY!</h1></body></html>'
    }


## 3\. `context.data(key)`

Returns the value of an previously-assigned key in the konf object. Since the konf object is evaluated from top to bottom, it is possible to access previous keys in later assignments. For example you may wish to reuse a selection made for the `content` within `footer`. 

    'content': function() {
        return $('.page-content')
    },
    'footer': function(context) {
        return context.data('content');
    }

This passes to `footer` the value of the `content` key, which is in turn the evaluated return of the selector `$('.content')`.

**Variable Resolution**

`context.data(key)` returns the matching key at the closest level. If the key is not found at the current level, it ascends to the parent level and tries again. 


## 4\. `context.tmpl(template)`

Returns the specified .tmpl file template, rendered against the evaluated konf object. 

    'OUTPUTHTML': function(context) {
        return context.tmpl('home')
    }

This renders the _home.tmpl_ via the `OUTPUTHTML` key. By default, all _.tmpl_ files in the project's _tmpl/_ folder are available to the `context.tmpl` function.

A common pattern is to conditionally assign template names to a specific key in the konf object, access the key with `context.data`, then use `context.tmpl` to render the selected template using the `OUTPUTHTML` key:

    'template': 'home',
    'OUTPUTHTML': function(context) {
        var template = context.data('template')
        return context.tmpl(template)
    }

This assigns a value of `home` to the key later referenced by `context.data`. The returned value is passed to _context.tmpl_ as a template name, which is returned to `OUTPUTHTML` for rendering.


## 5\. `context.choose(obj1[, obj2[, ...]])`

Accepts anonymous JSON objects as parameters and returns the first object that matches. An object is considered to match if all internal keys prefixed with `!` evaluate to a truthy value:

    'content': function(context) {
        return context.choose({
            '!home': function(context) {
                return $('#product-carousel')
            }
        }, {
            '!products': function(context) {
                return $('.product-listing')
            }
        })
    }

In this example, the first object would match if the function assigned to the key `!home` evaluated to a truthy value. If it did not, the first object would not match and the next object would be tested. If both match, only the first is returned.

An object with no required selections always matches:

    'content': function(context) {
        return context.choose({
            'home': function(context) {
                return $('#product-carousel')
            }
        })
    }

If no matching objects are found `context.choose` returns undefined. Multiple keys may be prefixed with `!` to create `and` conditions: 

    'home': function(context) {
        return context.choose({
            'templateName': 'homePage',
            '!productCarousel': function() {
                return $('#product-carousel')
            },
            '!saleItems': function() {
                return $('.sale-items')
            }
        },
    }

So in this case if both selectors evaluate to true within the current page, the home key will be assigned the value of `templateName`, otherwise it remains unassigned.

A common pattern in a konf object is to use `context.choose` to select template specific content and set a key which will be used as the template name:

    'content': function(context) {
        return context.choose({
            'template': 'home',
            '!home': function(context) {
                return $('#product-carousel')
            }
        }, {
            'template': 'saleItems',
            '!item': function(context) {
                return $('.sale-items')
            }
        })
    },
    'OUTPUTHTML': function(context) {
        var template = context.data('content.template')
        if (template) {
            return context.tmpl(template)
        }
    }


**Truthiness Of `!`**

`context.choose` considers a value to be truthy if it matches one of the following conditions:

    obj.length && obj.length > 0
    obj == true

If none of these conditions are true then a value is considered falsey.

Important: changing the DOM within required selections might adversely affect evaluation further down the konf. We recommend avoiding DOM manipulation on required selections in the konf.


## 6\. Reserved Keys

Your konf object extends a default konf object containing the following reserved keys:

`$html`: Reference to the source DOM element

`$head`: Reference to the source DOM element

`$head`: Reference to the source DOM element

`buildDate`: The date this _mobify.js_ file was built

`config.configDir`: Path to the folder from where _mobify.js_ loaded

`config.configFile`: Path to _mobify.js_

`config.HD`: A boolean flag that will be true if this device has a high density display 

`config.isDebug`: A boolean flag that will be true if mobify.js is running in debug mode

`config.orientation`: A string that will be "portrait" if the device is taller than it is wide, or "landscape" if it is wider than it is tall

`config.os`: A string representing the detected operating system of the device

`config.path`: A string representing the path from where the mobify.js file was loaded

`config.started`: An internal flag used to record whether the page has been transformed

`config.tagVersion`: Version of the Mobify tag used on this site

`config.touch`: A boolean flag that will be true if touch events are supported, false otherwise

`configName`: A property pulled from _project.json_ - most likely the unique identifier for your site

`cssName`: A function returning the name of the css file to be applied

`imageDir`: A function returning a path to where mobify adaptation specific image assets are kept

`mobileViewport`: Contents of the meta viewport tag to be sent

`siteConfig`: An object containing analytics configuration information

`touchIcon`: The location of a file to be used as the bookmark icon for this website on iOS devices

`unmobify`: An internal flag used to record whether the page has been unmobified

## 7\. Best Practices

* DO: Prefer the matching of more complete DOM outlines over single selectors when assigning templates to specific pages.

* DO NOT: alter the source DOM in required selectors, as they are evaluated regardless of whether they are used as a context to evaluate templates.
