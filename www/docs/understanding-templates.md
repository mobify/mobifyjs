---
layout: doc
title: Understanding Templates | Mobify.js Framework Documentation
---

# Understanding Templates

In Mobify.js, templates are text files that contain HTML markup, as
well as variables that are replaced with the selections from the konf
when the template is rendered. The konf decides which template should
be rendered based on the contents of the source DOM.

## Templates in Theory

A common pattern is to assign a template name to _content.templateName_
and later call `context.tmpl` on it:

    'content': function(context) {
        return context.choose(
        {
            'templateName': 'home',
            '!products': function(context) {
                return $('#products');
            }
        })
    },
    'OUTPUTHTML': function(context) {
        var templateName = context.data(context.templateName);
        if (templateName) {
            return context.tmpl(templateName);
        }
    }


If `'home'` is assigned to _content.templateName_ the template
compiled from _src/tmpl/home.tmpl_ will be rendered. This is explained
in more detail in the [Konf Reference]({{ site.baseurl }}/docs/konf-reference/).

By default, Mobify.js compiles _.tmpl_ files from the _src/tmpl/_
directory and makes them available to `context.tmpl`.

Templates are text files that construct an HTML document. A simple
_home_ template might look like this:

    <!DOCTYPE html>
    <html>
    <head><title>Home</title></head>
    <body>
        <ul>
            {#content.products}
                <li>{.}</li>
            {/content.products}
        </ul>
    </body>
    </html>

Assuming that the key _content.products_ selected a set of _<div>_
elements, calling `context.tmpl('home')` would evaluate the template
with the selected data, producing a string containing the following
markup:

    <!DOCTYPE html>
    <html>
    <head><title>Home</title></head>
    <body>
        <ul>
            <li><div>Product 1</div></li>
            <li><div>Product 2</div></li>
            <li><div>Product 3</div></li>
        </ul>
    </body>
    </html>


## Templates in Practice

Websites generally have the same common templates: a header, footer,
base, and page specific templates. We include these different
templates in our scaffold when you initially create a product. For
example, a home template would typically look like this:

    {>base/}

    {<content}
        <h1>Homepage</h1>
        <ul>
            {#content.products}
                <li>{.}</li>
            {/content.products}
        </ul>
    {/content}

_{>base/}_ is a **partial**, or template include, that uses base as its
parent template. _{<content}_ is a **block override** that overrides the
content **block placeholder** within the base template. Here is a basic
example of a base template:

    <html>
    <head>
        <link rel="stylesheet" href="style.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    </head>
    <body>
        {>_header/}
        {+content}{/content}
        {>_footer/}
    </body>
    </html>

{+content} is the block placeholder being overridden in the
home template. We also have {>_header} and {>_footer}, which are two more
partials that insert the _header and _footer files above and below the
content block. Thus, any page that includes base will also have the header
and footer.

---

## Where Next?

* [The Template Reference contains a complete list of all template features]({{ site.baseurl }}/docs/template-reference/)

