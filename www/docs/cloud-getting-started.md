---
layout: doc
title: Getting Started with the Mobify Cloud | Mobify.js Framework Documentation
---


# Requirements

Mobify should be setup on your website before beginning this guide:

  * You have inserted the Mobify tag onto your website.

  * You have downloaded the Mobify Client and ran the development
    server using the command `mobify preview`.

  * You have created or downloaded a project folder.

If you haven't completed these steps head back to cloud.mobify.com and
finish setting up your site!

----

# Introduction

In this guide you will alter the look and feel of your mobile site
by changing the files in the project folder. You will learn how to
select additional elements from your desktop site and how to use
different mobile templates on other pages of your site.

## Previewing your Work

To see your changes you'll need to run the development server from
your project folder.

In Terminal, change directory into your project. Start the development
server by running the `mobify preview` command.

On cloud.mobify.com browse to your project's "Preview" page. Select
"localhost" to preview the adaptation created from the project folder
on your computer.

If everything worked you should see a preview of your mobile site using
the adaptation served from the development server.

You can open the preview in a standalone window by clicking the "Open
in New Window" button. Refreshing the page will show your latest saved
changes.

## Debugging your Work

Debugging Mobify requires the use of a web inspection tool like WebKit
Inspector or Firebug. [For more information visit the Mobify.js Appendix](http://www.mobify.com/mobifyjs/docs/appendix/#debugging).

----

# How does Mobify work?

When a mobile device arrives on your website, the Mobify tag activates
and loads the adaptation to create your mobile site. In development,
the adaptation is loaded from the development server running on your
computer.

The adaptation is created from the files in your project folder. The
most import file in your project is the "mobify.konf" file. The "konf"
is JavaScript file required by every Mobify project. It controls how
your mobile site is created by performing a series of operations on
the DOM constructed from the page's original HTML or source DOM.

Start changing your mobile site by editing the konf!

----

# Diving into the Konf

Open 'mobify.konf' with your text editor. You'll find it inside the 'src'
folder of your project.

Inside the konf you'll find CSS selectors used to select content
from your desktop site. In the konf, `$` references a Zepto object
that queries the source DOM. It is the primary method for selecting
elements.

You can think of the konf as JavaScript object. Keys are assigned to
functions which should return elements selected from the source DOM `$`.

To select another element from your desktop site, add another key/value
pair to the konf. Konf values must be functions that return their selections:

    // WRONG! The value is not a function.
    'header': $('header')

    // RIGHT! Use functions to return values.
    'header': function() {
        return $('header');
    }

You can nest selections to group related keys:

    'header': {
        'logo': function() {
            return $('.logo');
        }
      , 'title': function() {
            return $('h1');
        }
    }

Remember the konf is written in JavaScript so make sure to use correct
syntax to avoid errors!

## Page Specific Selections

Up to this point you have been using the same selections on every
page of your site. Often you will want elements to only be selected on
specific pages.

For instance, what if you'd like to select company information on the
"About" page but not on the "Home" page?

In the konf file, find the following block and uncomment it:

    /*
    ,{
        '!templateName': 'about',
        '!phonenumber' : function() {
             return $('.selector_for_phone_number');
    },
        '!blurb': function() {
             return $('.selector_for_blurb');
        }
    }
    */

The `context.choose` functions allows you to make specific selections
only if a certain conditions are met.

## Using `context.choose`

This function accepts a variable number of arguments and then iterates
through them:

  1. In the current argument find all keys that start with `!`. These
     are called "required" keys.

  2. Run the functions assigned to the required keys. If any of
     them return falsey values, for example an empty collection,
     advance to the next argument and repeat the process.

  3. If all required keys return truthy values, run the rest of the
     keys in the argument and return the result.

  4. If no arguments match, return `undefined`.

So for the second argument added to `context.choose` to match, we must
find a way to make the required key in the first argument falsey.

Are there pages on your site for which the required key will not match?
Could you tweak the required key condition to be more specific?

Update the keys and selectors of the argument you uncommented to match
another page on your site. Update _templateName_ to an appropriate value
for the page then navigate to it in your preview window.

If everything went right you will see ... a blank page!

If you open your WebKit inspector console you should see Mobify
complaining that it couldn't find a template file for you new template.

Let's create that now!

----

# Templates

Templates are text files that contain HTML markup, as well as variables
that are replaced with the selections from the konf when the template
is rendered. The konf decides which template should be rendered based
on the contents of the source DOM.

Templates are found inside the "src/tmpl" folder of your project.
Projects start with four templates:

  * **base.tmpl**: Contains the boilerplate HTML for your project
    including a mobile viewport, a default CSS file and a set of
    block placeholders which can be overridden by other templates.

  * **home.tmpl**: A page template that extends the 'base.tmpl' to
    create the homepage.

  * **_header.tmpl**: A partial template included by 'base.tmpl' to
    creates the site's header.

  * **_footer.tmpl**: A partial template included by 'base.tmpl' to
    create the site's footer.

In the konf, _OUTPUTHTML_ calls `context.tmpl` which finds the matching
template and renders it.

When you referred to a new template, there was no corresponding template
file for it! Create a file "&lt;template&gt;.tmpl" inside the templates
folder where &lt;template&gt; is the value you assigned to _templateName_.
Paste the following:

    {>base/}

    {<content}
        <h1>About</h1>
        <h3>My phone number: "{content.phonenumber}"</h3>
        <p>{content.blurb}</p>
    {/content}


Change the variable references to match the ones you used in your
argument. Refresh the page and bang - you should see you new template!

---

# Next Steps:

  * [Read more about the konf at mobifyjs.com](http://www.mobify.com/mobifyjs/docs/understanding-konf/)

  * [Read more about templates at mobifyjs.com](http://www.mobify.com/mobifyjs/docs/understanding-templates/)

  * [Learn how to publish your site to production]()