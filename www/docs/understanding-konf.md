---
layout: doc
title: Understanding the Konf 
---

#   Understanding the Konf

The konf is a JavaScript file required by every Mobify.js project. In 
the default project scaffold it lives at _src/mobify.konf_. It controls
how the page is adapted for different devices and is responsible for 
selecting elements from the source DOM, picking a template and rendering
the output to the browser.

##  Konf Theory

Here is a minimal _mobify.konf_:

    {>"/base/lib/base_konf.konf"/}
    {<konf} {

    'OUTPUTHTML': function() {
        return '<html><body><h1>HELLO MOBIFY!</h1></body></html>';
    }

    } {/konf}

Inside the `{<konf} ... {/konf}` block, we declare an object
called the konf object. We give the konf object a key _[OUTPUTHTML]({{ site.baseurl }}/docs/konf-reference/#outputhtml)_ 
and assign that to a function that returns an HTML string. When the konf 
object is evaluated, the function assigned to _OUTPUTHTML_ is called.
The value assigned to _OUTPUTHTML_ is immediately rendered to the browser.

The konf object is an ordinary JavaScript object so we can add other keys 
to it:

    {>"/base/lib/base_konf.konf"/}
    {<konf} {

    'body-element': function() {
        return $('body');
    },
    'OUTPUTHTML': function() {
        return '<html><body><h1>HELLO MOBIFY!</h1></body></html>';
    }

    } {/konf}

Here we have added the key _body-element_ which queries the source DOM
by calling `$('body')` and returning the result. Inside the konf block, 
`$` references the [Zepto](http://zeptojs.com/) object and is the primary
method for selecting elements.

In this case it will return the source DOM's _&lt;body&gt;_ element.

Konf key values _must_ be functions that return their selections:

    // WRONG! Not a function!
    'body-element': $('body');

    // RIGHT! Here's a function:
    'body-element': function() {
        return $('body');
    }

    // RIGHT! A function, that accepts an argument:
    'body-element': function(context) {
        return $('body');
    }

All konf key values are passed an argument called [`context`]({{ site.baseurl }}/docs/konf-reference/). 
The argument is optional, but it enables additional functionality:

    'body-element': function() {
        return $('body');
    },
    'images': function(context) {
        return context.data('body-element').find('img');
    }

Here, the function assigned to the _images_ uses [`context.data`]({{ site.baseurl }}/docs/konf-reference/#context-data)
to look up the previously assigned value of _body-element_,  which is 
a Zepto set containing the source DOM's _<body>_ element. 
It then finds all of its child _<img>_ elements using Zepto's 
`find` function.

##  Konf in Practice

Inside the konf, it is common to have a number of selections that are
made on every page. For example, elements in the header may appear on
every page of the adapted site. These global selections can be made by
adding additional keys to konf.

    // Keys on the konf object are added to the context
    'header': function() {
        return $('.header')
    }
    // Use nested objects to group related selections
    'footer': {
        'privacy': function() {
            return $('.privacy');
        }
      , 'copyright': function() {
            return $('.copy')
        }
    }

Often the konf will contain selections that should only be used on certain 
pages. For example, an image carousel may only appear on the homepage.
To manage selections that should only be made on certain pages we use
[`context.choose`]({{ site.baseurl }}/docs/konf-reference/#context-choose):

    'content': function(context) {
        // `context.choose` is used to conditionally
        // add keys to the context
        return context.choose({
            'templateName': 'home'
          , '!carousel': function() {
                return $('#main .pics')
            }
        }, {
            'templateName': 'products'
          , '!products': function() {
                return $('#products')
            }
        })
    }

`context.choose` accepts a variable number of objects as arguments and
evaluates the first one that matches. An argument is said to match if
its keys starting with `!` all evaluate to truthy values.

In the example above, when _content_ is evaluted, `context.choose` will
be called. It inspects the first argument and finds one required key 
_carousel_. If `$('#main .pics')` is found on the page then the first 
argument will match. `context.choose` will then add the keys 
_templateName_ and _carousel_ under the group _content_.

If `$('#main .pics')` was not found, it would move to the next argument
and repeat the process.

---

##  Where Next?

* [The Konf Reference contains a complete list of all function available on the `context` object]({{ site.baseurl }}/docs/konf-reference/)