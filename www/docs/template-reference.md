---
layout: doc
title: Template Reference | Mobify.js Framework Documentation
---

# Template Reference

  * Understanding Context
  * `{foo}` - Variables
  * `{foo|bar}` - Variable Filters
  * `{#foo}...{/foo}` - Attributes
  * `{#foo}...{.}...{/foo}` - Iteration
  * `{>foo/}` - Includes
  * `{+bar}...{/bar}` - Block Placeholders
  * `{<bar}...{/bar}` - Block Overrides
  * `{?foo}...{/foo}` - Conditional (existence)
  * `{^foo}...{/foo}` - Conditional (non-existence)
  * `{{ '{%' }}script}...{/script}` - Inline Script Pragma
  * `{! Comment !}` - Template Comments
  {:toc}

##  Understanding Context

Templates are HTML documents containing variables to be replaced by
data. This data comes from the evaluated konf output, referred to as
the **context** for the template.

The context is a tree of all the keys that your konf has evaluated
that apply to this template.

When developing with Mobify.js, you can view the full tree within your
browser's Javascript console (see [our tools guide in the
appendix]({{ site.baseurl }}/docs/appendix/#tools), if
you're not familiar with its use). Browse to the page you'd like to
inspect, open the console and find `All extracted data` -- expand it
to view all evaluated keys. Any of these are available for use as
variables within your template. You'll find many internal keys that
Mobify generates during operation, see
[Reserved Keys]({{ site.baseurl }}/docs/konf-reference/#reserved-keys)
for a list of these.

Note that when we talk about changing levels of context below, we mean traversing
the levels of this context tree.


##  `{foo}` - Variables: Select & Render A Single Variable

Select elements from your source DOM in the konf file, then reference
the selection as a variable from any template using the curly brace
syntax:

### Source HTML input:

     <form id="search">
         <input type="submit" value="Send" />
     </form>

### Assign a selection to a key, in the konf:

     'search': function() {
         return $("form#search");
     },

### Render the result of the `search` key selection in the konf as a
variable within your template:

     <div class="search">
         {search}
     </div>

### Output HTML:

     <div class="search">
         <form id="search">
             <input type="submit" value="Send" />
         </form>
     </div>

### Variable Evaluation

Zepto collections are evaluated by iterating the objects in the
collection, taking the JavaScript `outerHTML` attribute of each of
them, then concatenating these together.

A single DOM Element will evaluate to its `outerHTML` attribute.

Note that all strings are escaped by default, so use a filter (see
[filter reference below](#filters)) if you'd like to output HTML.

### Variable Resolution

Variables are first looked-up in the keys at the current level of the
context. If a key matching the variable name is not found at this
level, the key will be searched for at the next highest level of the
context, and so forth until it is found, or the highest level of the
context is reached.


##  `{foo|bar}` - Variable Filters: Pass The Value `foo` Through Filter `bar` {#filters}

If you would like to change how a variables value is rendered,
especially values produced from Zepto collections or a DOM element,
you can use filters. Add a pipe symbol `|` and filter name inside the
template tag:

### Source HTML input:

    <h3 class="warning">
        <img src="icon.png" class="icon"> Warning: your balance is low
    </h3>

### The selection in the konf:

    'warning': function() {
        return $(".warning");
    },

### Add a filter to the `warning` variable within your template:

    {warning|innerHTML|s}

### Output HTML:

    <img src="icon.png" class="icon"> Warning: your balance is low

You can apply multiple filters in a chain by appending another pipe
symbol `|` and filter name inside the template tag. Note that filters
are cumulative, and will apply each additional filter to the output of
the previous one.

### Available Filters

* `innerHTML` - render the `innerHTML` of a Zepto collection or DOM
                element. Note: the output of this filter will be HTML
                escaped, chain with `s` to safely render as HTML.

* `openTag` - output the literal opening tag of a DOM element. Note:
              the output of this filter will be HTML escaped, chain
              with `s` to safely render as HTML.

* `closeTag` - output the literal closing tag of a DOM element.
               Note: the output of this filter will be HTML escaped,
               chain with `s` to safely render as HTML.

* `s` - render HTML safe output, unescapes HTML escaped strings, such
        as values filtered through the `innerHTML` filter.


## `{#foo} ... {/foo}` - Accessing Attributes Of, Or Descending Into The Variable `foo`

You are able to access any variable and its attributes. To simply
access an attribute, you can use the simpler `{variable.attribute}`
syntax:

### Source HTML input:

    <div class="site-header">
        <h1>DemoCorp Inc.</h1>
        <nav>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/products/">Products</a></li>
                <li><a href="/contact/">Contact</a></li>
            </ul>
        </nav>
    </div>

### Create a header variable with logo attribute in the konf:

    'header': {
        'logo': function() {
            return $('.site-header h1');
        }
    }

### Access the `logo` attribute within your template:

    <div id="fixed-nav">
        {header.logo}
    </div>

### Output HTML:

    <div id="fixed-nav">
        <h1>DemoCorp Inc.</h1>
    </div>

Note that you can also access the same attribute within your template
by descending into the header block, which is valuable when you have
attached multiple attributes to the same variable. The output HTML
would be identical to the last example:

    <div id="fixed-nav">
        {#header}
            {logo}
        {/header}
    </div>


## `{#foo} ... {.} ... {/foo}` - Iterate Over The Variable `foo`

When you make a selection within the konf that returns a set with
multiple elements, you can iterate through those elements in
your template using the `.` attribute, which is a reference to the
current iteration:

### Source HTML input:

    <div class="site-header">
        <h1>DemoCorp Inc.</h1>
        <nav>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/products/">Products</a></li>
                <li><a href="/contact/">Contact</a></li>
            </ul>
        </nav>
    </div>

### Create a variable with attributes in the konf:

    'header': {
        'logo': function() {
            return $('.site-header h1');
        },
        'nav': function() {
            return $('.site-header nav a');
        }
    }

### Descend into the `header` variable to access `logo` and `nav`
attributes, also iterate `nav`:

    <div id="fixed-nav">
        {#header}
            {logo}
            <ul class="pull-right">
                {#nav}
                    <li>{.}</li>
                {/nav}
            </ul>
        {/header}
    </div>

### Output HTML:

    <div id="fixed-nav">
        <h1>DemoCorp Inc.</h1>
        <ul class="pull-right">
            <li>
                <a href="/">Home</a>
            </li>
            <li>
                <a href="/products/">Products</a>
            </li>
            <li>
                <a href="/contact/">Contact</a>
            </li>
        </ul>
    </div>


## `{>foo/}` - Include The Partial `foo` Inside The Current Template

Partials, also known as template includes, allow you to make a
template composed of other templates:

### Contents of partial `logo`:

    {site.logo}

### Referencing a partial to include in your template _foo.tmpl_:

    <div id="header">
        {>logo/}
        {site.nav}
    </div>

This would insert the template _logo.tmpl_ into _foo.tmpl_.

### Resulting markup of the combined _logo.tmpl_ and _foo.tmpl_ templates:

    <div id="header">
        <h1>DemoCorp Inc.</h1>
        <nav>
            <ul>
                <li><a href="/">Home</a></li>
            </ul>
        </nav>
    </div>


## `{+bar} ... {/bar}` - Block Placeholders {#block-placeholders}

Blocks allow you to define snippets of template code that may be
overridden by other templates:

### Adding an overridable block `header` to _foo.tmpl_:

    {+header}Plain Old Default Header{/header}

See [Block Overrides](#block-overrides) for override usage.


## `{<bar} ... {/bar}` - Block Overrides {#block-overrides}

Adding an overridable block `header` to _foo.tmpl_:

    {+header}
        Plain Old Header
    {/header}
    {>products/}

Overrides the content of `header` in _foo.tmpl_ from within the
included template _products.tmpl_:

    {<header}
        More Specific Products Header!
    {/header}

Note that a special variable is available within a block that allows
you to access the content that would otherwise be replaced from a
block being overridden. This variable is called `_SUPER_` and it
allows you to extend, instead of override, the previous contents of
the block.

    {<header}
        {_SUPER_}
        More Specific Products Header!
    {/header}

In our example above, the resulting contents of header with `_SUPER_`
would be the contents of both headings combined:

    Plain Old Header More Specific Products Header!

See [Block Placeholders](#block-placeholders) for placeholder usage.


## `{?foo} ... {/foo}` - Conditional, Check For The Existence Of Variable `foo`

Provide conditional output based on the existence of a variable.

    {?user}
        Welcome {user}.
    {:else}
        Please login.
    {/user}

Here, if the key 'user' is defined and non-empty in the context, the
template will render a greeting to the user, otherwise, it will render
the text "Please Login".


## `{^foo} ... {/foo}` - Conditional, Check For The Non-existence Of Variable `foo`

Provide conditional output based on the non-existence of a variable.
This template will render be the same as above.

    {^user}
        Please login.
    {:else}
        Welcome {user}.
    {/user}



## `{{ '{%' }}script} ... {/script}` - Inline Script Pragma

By default, templates collapse whitespace. This is a problem when
templating elements where whitespace matters, like inline scripts
featuring single-line comments.

The `{{ '{%' }}script}` pragma is provided to safely handle inline scripting
in templates.

    {{ '{%' }}script}
        // Show an alert dialog
        alert("Hello Mobify!")
    {/script}

See [handling JavaScript](https://support.mobify.com/customer/portal/articles/513026-handling-javascript-with-mobify-js) for more detail.


## `{! Comment !}` - Template Comments

Text surrounded by `{!` and `!}` are considered comments and will not be rendered.

    {! Comments are a good way to explain
       complex template logic. !}

## Mobify.desktop() - Back to Desktop

Add this anchor tag to your templates to allow users to revert back to the
non-mobified version of your site:

    <a href="" onclick="Mobify.desktop();return false;">
    View Full Site
    </a>

## Back to Mobile

This anchor tag will allow users to go back to the mobile site:

    <a href="#" onclick="document.cookie='mobify-path=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';location.reload()">
        Back to Mobile
    </a>

But with a "Back to Mobile" button, you don't want it to show up on your desktop site for non-mobile devices.
So the best thing to do here is to conditionally insert this element into your desktop site based on the device, like this:

    <script type="text/javascript">
        if (/ip(hone|od)|android.*(mobile)|blackberry.*applewebkit|bb1\d.*mobile/i.test(navigator.userAgent)) {
            var backToMobile = document.createElement("div");
            backToMobile.innerHTML = '<a href="#" onclick="document.cookie=\'mobify-path=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/\';location.reload()">Mobile Site</a>';
            document.getElementById("**ELEMENT_TO_APPEND_TO**").appendChild(backToMobile);
        }
    </script>

# Best Practices

## Template File Naming Conventions

Templates must be stored in your project folder under _src/tmpl/_
using the _.tmpl_ file name extension:

    <project>/src/tmpl/home.tmpl


## Use A Base Template

The bulk of your template logic should be inherited from another
template using partials and blocks. For example, _base.tmpl_:

    <!DOCTYPE html>
    <head>
        {+head}{/head}
    </head>
    <body>
        {+body}{/body}
    </body>
    </html>

And in `home`:

    {>base/}

    {<head}
        <title>Home</title>
    {/head}

    {<body}
        <h1>Home</h1>
    {/body}


## Prefix Introduced Styling Attributes With `x-`

Mobify.js preserves the attributes and content of elements selected
from the source DOM. To differentiate between content from templates
and content selected from the source DOM, it can be helpful to prefix
attributes you introduce in your templates for the sake of styling.

    <div class="x-banner">
        {banner}
    </div>

We recommend you prefix all classes and IDs introduced in templates
with `x-` to allow you to identify content introduced with the
template.

