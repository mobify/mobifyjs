---
layout: doc
title: Understanding the Konf | Mobify.js Framework Documentation
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

Inside the `{<konf} ... {/konf}` block, we declare the konf object.
We give the konf object a key _[OUTPUTHTML]({{ site.baseurl }}/docs/konf-reference/#outputhtml)_
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

All konf key functions are passed an argument called [`context`]({{ site.baseurl }}/docs/konf-reference/).
The argument is optional, and enables additional functionality:

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

Often you will want elements like the header to appear on every page
of your site. Global selections can be made by adding more keys to konf:

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

Often you will want to use different templates to adapt different pages
of you site. For example, you may use the template _home_ to adapt the
homepage of your site while using the template _products_ on the product
listing page.

Inside the konf, this can be handled by using `context.choose` to select
a template and then passing that template name to `context.tmpl`:

    'content': function(context) {
        return context.choose({
            'templateName': 'home',
            '!home': function() {
                return $('#home');
            }
        }, {
            'template': 'item',
            '!item': function() {
                return $('#item');
            }
        });
    },
    'OUTPUTHTML': function(context) {
        var template = context.data('content.templateName');
        if (template) {
            return context.tmpl(template);
        }
    }

`context.choose` accepts a variable number of objects as arguments and
evaluates the first one that matches. An argument is said to match if
all keys starting with `!` evaluate to truthy values.

In the example above, when _content_ is evaluted, `context.choose` is
called. It checks the first argument and finds one required key, _home_. If
`$('#home')` is found in the source DOM then the first argument will match.
`context.choose` will then add the keys _templateName_ and _home_ under the
group _content_. If `$('#home')` is not found, it would move to the next
argument and repeat the process.

Later, when _OUTPUTHTML_ is evaluted, the value of _content.templateName_
will be used to decide which template to render.


---

##  Where Next?

* [The Konf Reference contains a complete list of all function available on the `context` object]({{ site.baseurl }}/docs/konf-reference/)