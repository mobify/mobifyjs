---
layout: doc
title: Understanding the Konf 
---

# Understanding The Konf

The konf file is JavaScript code written to select content from the source DOM. Selections made in the konf are used as the context for templates to render the mobile page. [Learn more about templates](https://support.mobify.com/customer/portal/articles/511698-understanding-templates)

A konf file is required in any Mobify project and by default lives at 'src/mobify.konf':

    {>"/base/lib/base_konf.konf"/}
    {<data} {

    'OUTPUTHTML': function(context) {
        return '<html><body><h1>HELLO MOBIFY!</h1></body></html>'
    }

    } {/data}

Inside the `{<data} ... {/data}` block, we declare a JavaScript object called the konf object. Inside, we assign the key `OUTPUTHTML` to a function that returns an HTML string. When the konf object is evaluated, the function assigned to `OUTPUTHTML` gets called and the result is rendered to the browser immediately. Because of this, the `OUTPUTHTML` key should **always** be the last key assigned in the konf object.

The konf object is an ordinary JavaScript object so we can add arbitrary keys to it:

    {>"/base/lib/base_konf.konf"/}
    {<data} {

    'body': function(context) {
        return $('body')
    },
    'OUTPUTHTML': function(context) {
        return '<html><body><h1>HELLO MOBIFY!</h1></body></html>'
    }

    } {/data}

Here we have added the key `body` whose contents are set to the result of evaluating the `$('body')` selector. `$` is assigned to a regular Zepto instance. We use it to make selections from the original desktop content, ie. the source DOM.

Konf object values must always be anonymous functions that explicitly return the selected data:

    // ERROR
    'body': $('body')

    // CORRECT
    'body': function() {
        return $('body')
    }

    // CORRECT
    'body': function(context) {
        return $('body')
    }

The `context` argument is optional, but enables additional functionality when passed:

    'body': function() {
        return $('body')
    },
    'img': function(context) {
        return context.data('body').find('img')
    }

`context.choose`, `context.data`, and `context.tmpl` are functions that require `context` to be passed, [learn more about them](https://support.mobify.com/customer/portal/articles/511630-konf-reference)
