---
layout: doc
title: Getting Started
---

# Gettings Started

You've downloaded the mobify-client, created a project scaffold *myproject*,
and put the tag on the page you'd like to adapt. You've seen "Hello World", but
crave more.

Open _myproject/src/mobify.konf_ in your text editor. The konf is a JavaScript
file required by every Mobify.js project. It contains the operations performed 
on the source DOM. The _mobify.konf_ in the scaffold project selects the text 
content of the &lt;title&gt; element and renders a template to display it.

Let's change it to display to first &lt;a&gt; element on the page. Change the 
*content* key to the following:

    'content': function(context) {
        return context.choose({
            'templateName': 'home'
          , '!link': function() {
                return $('a[href]').first();
            }
        })
    },

Now open _myproject/src/tmpl/home.tmpl_ and update the contents of the 
*p.extract* tag:
    
    <p class="extract">{content.link}</p>

Save your changes and refresh the page. You should see the first link from your 
adapted page:

![Yippy, we've got a link!](/mobifyjs/static/img/getting-started-link.png)

Inside the konf, `$` is bound to [Zepto](http://zeptojs.com), which queries the 
source DOM. We've told the konf to select the first link and store it in the 
context under the key *content.link*. We then updated the varaible in the 
template to refer to this key in the konf.

Follow the link in your browser.

The same adaptation is being applied to this page! Let's change the konf to 
make different selections on this page and render a different template.

Update your konf:

    'content': function(context) {
        return context.choose({
            'templateName': 'subpage'
          , '!routing': function() {
                return location.pathname != '/';
            }
          , 'headings': function() {
                return $('h1');
            }
        }, {
            'templateName': 'home'
          , '!link': function(context) {
                return $('a[href]').slice(7, 8);
            }
        })
    },

Refresh the page.

Egads! It's a blank page. What's going on? Open the Webkit Inspector to see 
debugging information:

![Helpful debugging information is output to the console](/mobifyjs/static/img/getting-started-error.png)

We told Mobify.js to use the *subpage* template for this page but didn't create
a _src/tmpl/subpage.tmpl_. Let's make that now:

    {>base/}

    {<body}
        <h1>Template Name: {content.templateName}</h1>
        <ul>
            {#content.headings}
                <li>{.|innerHTML}</li>
            {/content.headings}
        </ul>
    {/body}

The template we just created inherits for _base.tmpl_ and overrides the *body*
block within it. If you open up the _base.tmpl_, you can see that you have full
control over the HTML markup of the adapted page!

## Where next?

* [Understanding the Konf](../understanding-konf/)
* [Understanding Templates](../understanding-templates/)
