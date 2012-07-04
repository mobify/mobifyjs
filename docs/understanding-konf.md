---
layout: doc
title: Understanding the Konf 
---

# Understanding The Konf

The konf file is JavaScript code that makes selections from the source DOM, chooses a template to render and renders that template with those selections as the context. [Learn more about templates](https://support.mobify.com/customer/portal/articles/511698-understanding-templates)

A konf file is required in every Mobify project and lives at _src/mobify.konf_.

Here is a very minimal _mobify.konf_:

    {>"/base/lib/base_konf.konf"/}
    {<data} 
    {

        'OUTPUTHTML': function(context) {
            return '<html><body><h1>HELLO MOBIFY!</h1></body></html>'
        }

    } 
    {/data}

Inside the `{<data} ... {/data}` block, we declare a JavaScript object called the konf object. Inside, we assign the key `OUTPUTHTML` to a function that returns an HTML string. When the konf object is evaluated, the function assigned to `OUTPUTHTML` is called and the result is written to the browser. 

Because of this, the `OUTPUTHTML` key must be the last key assigned in the konf object.

The konf object is an ordinary JavaScript object so we can add arbitrary keys to it:

    {>"/base/lib/base_konf.konf"/}
    {<data} 
    {
        'body-elemnt': function(context) {
            return $('body')
        },
        'OUTPUTHTML': function(context) {
            return '<html><body><h1>HELLO MOBIFY!</h1></body></html>'
        }
    } 
    {/data}

Here we have added the key `body-element` which makes a selection by calling `$('body')` and returning the results. Here, `$` is an instance of Zepto, a lightweight jQuery-compatible DOM library. 

We use it to make selections from the source DOM, in this case it will return the source DOM's `<body>` element.

Konf key values _must_ be anonymous functions that explicitly return the selected data:

    // WRONG! Not a function!
    'body-element': $('body')

    // RIGHT! Here's a function:
    'body-element': function() {
        return $('body')
    }

    // RIGHT! Another function, but this one takes an argument:
    'body-element': function(context) {
        return $('body')
    }

When called, these functions will be passed an argument that is conventionally named `context`. Using this argument is optional, but it enables additional functionality:

    'body-element': function() {
        return $('body')
    },
    'images': function(context) {
        return context.data('body-element').find('img')
    }
    
Here, the function assigned to the key `'images'` uses the `context.data()` function to look up the previously assigned value of the key `'body-element'`, which is a Zepto set containing the source DOM's `<body>` element, and then finds all of its child `<img>` elements using Zepto's `.find()` function.

`context.choose`, `context.data`, and `context.tmpl` are functions that require `context` to be passed, [learn more about them](https://support.mobify.com/customer/portal/articles/511630-konf-reference)
