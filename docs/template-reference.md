# Template Reference

1. Understanding Context
2. `{foo}` - Variables
3. `{foo|bar}` - Variable Filters
4. `{#foo}...{/foo}` - Attributes
5. `{#foo}...{.}...{/foo}` - Iteration
6. `{>foo/}` - Includes
7. `{+bar}...{/bar}` - Block Placeholders
8. `{<bar}...{/bar}` - Block Overrides
9. `{?foo}...{/foo}` - Conditional (existence)
10. `{^foo}...{/foo}` - Conditional (non-existence)
11. `{%script}...{/script}` - Inline Script Pragma
12. `{! Comment !}` - Template Comments

**Best Practices**

- Template File Naming Conventions
- Use a Base Template
- Prefix Introduced Styling Attributes With `'x-'`



## 1\. Understanding Context

Templates are HTML documents containing variables meant to be filled in with data extracted from your konf. This data comes from the evaluated konf output, referred to as the _context_ for the template.

Context can be thought of as a tree of all the keys that your konf has evaluated as being applicable to this particular template. 

You can view the full tree within your browser's Javascript console (see our tools guide in the Appendix if you're not familiar with its use). Browse to the page you'd like to inspect, open the console and find 'All extracted data' -- expand it to view all evaluated keys. Any of these are available for use as variables within your template. You'll find many internal keys that Mobify generates during operation, see Reserved Keys for a list of these.

Note that when we talk about changing levels of context below, we simply mean traversing the levels of this context tree. 


## 2\. `{foo}` - Variables: Select & Render A Single Variable

Use any jQuery-like (Zepto) selector to select elements from your source DOM within the konf file. Reference the selection as a variable from any template using the curly brace syntax:

*Original HTML input:*

     <form id="search">
         <input type="submit" value="Send" />
     </form>

*Assign a selection to a key, in the konf:*

     'search': function() {
         return $("form#search"); 
     },

*Render the result of the `search` key selection in the konf as a variable within your template:*

     <div class="search">
         {search}
     </div>

*Output HTML:*

     <div class="search">
         <form id="search">
             <input type="submit" value="Send" />
         </form>
     </div>

**Variable Evaluation**

Zepto collections are evaluated by iterating the objects in the collection and calling the JavaScript `outerHTML()` attribute on each of them. A single DOM Element will have `outerHTML()` called on it by default.

Note that all strings are escaped by default, so use a filter (see filter reference below) if you'd like to output HTML.

**Variable Resolution**

Variables are first looked-up at the current level of the context. If 'variable' is not found at this level, the variable will be searched for at the next highest level of the context, and so forth until it is found, or the highest level of the context is reached. 


## 3\. `{foo|bar}` - Variable Filters: Pass The Value `foo` Through Filter `bar`

If you would like to change how a variables value is rendered, especially values produced from Zepto collections or a DOM element, you can use filters. Add a pipe symbol `|` and filter name inside the template tag:

*Original HTML input:*

    <h3 class="warning">
        <img src="icon.png" class="icon"> Warning: your balance is low
    </h3>

*The original selection in the konf:*

    'warning': function() {
        return $(".warning"); 
    },

*Add a filter to the `warning` variable within your template:*

    {warning|innerHTML|s}

*Output HTML:*

    <img src="icon.png" class="icon"> Warning: your balance is low

You can apply multiple filters in a chain by appending another pipe symbol `|` and filter name inside the template tag. Note that filters are cumulative, and will apply each additional filter to the output of the previous one.

**Available Filters**

* `innerHTML` - render the `innerHTML()` of a Zepto collection or DOM element. Note: the output of this filter will be HTML escaped, chain with `s` to safely render as HTML.

* `openTag` - output the literal opening tag of a DOM element. Note: the output of this filter will be HTML escaped, chain with `s` to safely render as HTML.

* `closeTag` - output the literal closing tag of a DOM element. Note: the output of this filter will be HTML escaped, chain with `s` to safely render as HTML.

* `s` - render HTML safe output, unescapes HTML escaped strings, such as values filtered through the `innerHTML` filter.



## 4\. `{#foo} ... {/foo}` - Accessing Attributes Of, Or Descend Into The Variable `foo`

You are able to access any variable and its attributes. To simply access an attribute, you can use the simpler '{variable.attribute}' syntax:

*Original HTML input:*

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

*Create a header variable with logo attribute in the konf:*

    'header': {
        'logo': function() {
            return $('.site-header h1')
        }
    }

*Access the `logo` attribute within your template:*

    <div id="fixed-nav">
        {header.logo}
    </div>

*Output HTML:*

    <div id="fixed-nav">
        <h1>DemoCorp Inc.</h1>
    </div>            

Note that you can also access the same attribute within your template by descending into the header block, which is valuable when you have attached multiple attributes to the same variable. The output HTML would be identical to the last example:

    <div id="fixed-nav">
        {#header}
            {logo}
        {/header}
    </div>


## 5\. `{#foo} ... {.} ... {/foo}` - Iterate The Variable `foo`

When you make a selection within the konf that returns multiple objects, you can easily iterate through those objects in your template using the '.' attribute, which is simply a reference to the current iteration:

*Original HTML input:*

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

*Create a variable with attributes in the konf:*

    'header': {
        'logo': function() {
            return $('.site-header h1')
        },
        'nav': function() {
            return $('.site-header nav a')
        }
    }

*Iterate the `header` variable to access `logo` and `nav` attributes, also iterate `nav`:*

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

*Output HTML:*

    <div id="fixed-nav">
        <h1>DemoCorp Inc.</h1>
        <ul class="pull-right">
            <li><a href="/">Home</a></li>
            <li><a href="/products/">Products</a></li>
            <li><a href="/contact/">Contact</a></li>
        </ul>
    </div>            


## 6\. `{>foo/}` - Include The Partial `foo` Inside The Current Template

Partials, also known as template includes, allow you to compose a template made of other templates:

*Contents of partial `logo`:*

    {site.logo}

*`Referencing a partial to include in your template _foo.tmpl_:*

    <div id="header">
        {>logo/}
        {site.nav}
    </div>

This would insert the output of the template _logo.tmpl_ into _foo.tmpl_.

*Resulting markup of the combined _logo.tmpl_ and _foo.tmpl_ templates:*

    <div id="header">
        <h1>DemoCorp Inc.</h1>
        <nav>
            <ul>
                <li><a href="/">Home</a></li>
            </ul>
        </nav>
    </div>


## 7\. `{+bar} ... {/bar}` - Block Placeholders

Blocks allow you to define snippets of template code that may be overridden by any templates that reference this template:

*Adding an overridable block `header` to _foo.tmpl_:*
    {+header}Plain Old Default Header{/header}

See *Block Overrides* below for override usage.


## 8\. `{<bar} ... {/bar}` - Block Overrides

Adding an overridable block `header` to _foo.tmpl_:

    {+header}Plain Old Default Header{/header}
    {>products/}

Overrides the content of `header` in _foo.tmpl_ from within the included template _products.tmpl_:

    {<header}Exciting New More Specific Products Header!{/header}
    
Note that special variable is available within a block that allows you to access the content that would otherwise be replaced from a block being overridden. This variable is called `\_SUPER\_` and it allows you to extend, instead of override, the previous contents of the block.

    {<header}
        {\_SUPER\_}
    {/header}

In our example above, the resulting contents of header with `\_SUPER\_` would be the contents of both headings combined:

    Plain Old Default Header Exciting New More Specific Products Header!

See 'Block Placeholders' above for placeholder usage.


## 9\. `{?foo} ... {/foo}` - Conditional, Check For The Existence Of Variable `foo`

Provide conditional output based on the existence of a variable.

    {?user}
        Welcome {user}.
    {:else}
        Please login.
    {/user}


## 10\. `{?foo} ... {/foo}` - Conditional, Check For The Non-existence Of Variable `foo`

Provide conditional output based on the non-existence of a variable.
    
    {^user}
        Please login.
    {:else}
        Welcome {user}.
    {/user}


## 11\. {%script} ... {/script} - Inline Script Pragma

By default, templates collapse whitespace. This is a problem when templating elements where whitespace matters, like inline scripts featuring single-line comments. The `{%script}` pragma is provided to safely handle inline scripting in templates.

    {%script}
        // Show an alert dialog
        alert("Hello Mobify!")
    {/script}

See [handling JavaScript] https://support.mobify.com/customer/portal/articles/513026-handling-javascript-with-mobify-js for more detail.


## 12\. `{! Comment !}` - Template Comments

Text surrounded by `{!` and `!}` are considered comments and will not be rendered.

    {! 
        Comments are useful for explaining complex template logic.
    !}



# Best Practices

## Template File Naming Conventions

Templates must be stored in your project folder under _src/tmpl_ using the _.tmpl_ file name extension:

    <project>/src/tmpl/home.tmpl


## Use A Base Template

The bulk of your template logic should be inherited from another template using partials and blocks. For example, _base_:

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

Mobify.js preserves the attributes and content of elements selected from the source DOM. To differentiate between content from templates and content selected from the source DOM, it can be helpful to prefix any new attributes you introduce in your templates for the sake of styling.

    <div class="x-banner">
        {banner}
    </div>

We recommend you prefix all classes and IDs introduced in templates with `x-` to allow you to easily identify content introduced with the template.
