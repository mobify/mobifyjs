---
layout: doc
title: Understanding the Konf 
---

# Understanding The Konf

The konf is a JavaScript file  is JavaScript code that makes selections from the source
DOM, chooses a template to render and renders that template with those
selections as the context. [Learn more about
templates]({{ site.baseurl }}/docs/template-reference/)

A konf file is required in every Mobify.js project and lives at
_src/mobify.konf_.

Here is a minimal _mobify.konf_:

    {>"/base/lib/base_konf.konf"/}
    {<data} {
        'OUTPUTHTML': function(context) {
            return '<html><body><h1>HELLO MOBIFY!</h1></body></html>';
        }
    } {/data}

Inside the `{<data} ... {/data}` block, we declare a JavaScript object
called the konf object. Inside, we assign the key _OUTPUTHTML_ to a
function that returns an HTML string. When the konf object is
evaluated, the function assigned to _OUTPUTHTML_ is called and the
result is written to the browser.

Because of this, the _OUTPUTHTML_ key must be the last key assigned in
the konf object.

The konf object is an ordinary JavaScript object so we can add other keys 
to it:

    {>"/base/lib/base_konf.konf"/}
    {<data} {
        'body-element': function(context) {
            return $('body');
        },
        'OUTPUTHTML': function(context) {
            return '<html><body><h1>HELLO MOBIFY!</h1></body></html>';
        }
    } {/data}

Here we have added the key `body-element` which makes a selection by
calling `$('body')` and returning the results. Inside the konf, `$` 
references the [Zepto](http://zeptojs.com/) object which can be used 
to query the source DOM.

In this case it will return the source DOM's _&lt;body&gt;_ element.

Konf key values _must_ be functions that return their selections:

    // WRONG! Not a function!
    'body-element': $('body');

    // RIGHT! Here's a function:
    'body-element': function() {
        return $('body');
    }

    // RIGHT! Another function, but this one takes an argument:
    'body-element': function(context) {
        return $('body');
    }

When called, these functions are passed an argument that is 
conventionally named `context`. Using this argument is optional, but
it enables additional functionality:

    'body-element': function() {
        return $('body');
    },
    'images': function(context) {
        return context.data('body-element').find('img');
    }
    
Here, the function assigned to the key _images_ uses `context.data`
to look up the previously assigned value of the key _body-element_, 
which is a Zepto set containing the source DOM's _<body>_ element, 
and then finds all of its child _<img>_ elements using Zepto's 
`find` function.

---

## Where to Next?

* [The Konf Reference contains a full reference for the `context` object]({{ site.baseurl }}/docs/konf-reference/)