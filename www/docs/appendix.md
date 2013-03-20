---
layout: doc
title: Appendix | Mobify.js Framework Documentation
---

# Appendix

* TOC
{:toc}

# Debugging

## Tools

Debugging Mobify.js adaptations requires the use of a web inspection tool like
Webkit Inspector or Firebug. You're likely well-acquainted with one of these,
but here are a few quick start tips if not.

### Webkit Inspector

The Webkit Inspector is a powerful web development tool that is built into the
Safari and Chrome browsers.

To enable the inspector in Safari, open the Preferences pane, click Advanced,
then select _"Show Develop menu in menu bar"_. Open the inspector by right-clicking
on an element in a web page and then selecting _"Inspect Element"_.

In Chrome, open the inspector by right clicking on an element in a webpage and
then selecting _"Inspect Element"_.

### Firebug

Firebug provides similiar behaviour to the WebKit Inspector in the Firefox
browser. [Install the Firebug plugin](http://getfirebug.com/). Once installed,
in the browser's _"View"_ menu, click the _"Firebug"_ option at the bottom to
initialize.

For more on getting started with Firebug, watch [this helpful
video](http://www.youtube.com/watch?v=2xxfvuZFHsM).

## Debugging the Konf

The konf is written in JavaScript and you will often find syntax or logic errors
springing up as you develop. The best way to debug the konf is with the Webkit
Inspector or the Firebug extension.

In development mode, the result of the evaluated konf, the context, is logged to
the JavaScript console. Look for a the item _'All Extracted Data'_, which can be
expanded to show what values were assigned to what keys.

If you are stumped, try adding a `debugger;` statement into your konf. This will
cause the inspector's debugger to pause as the konf is evaluated:

    'content': function() {
        debugger;
        // The debugger will pause here.
        return $('.content');
    }

You can then use the inspector to step through the execution of your konf.

## Debugging Templates (Viewing source, inspecting rendered DOM)

Mobify.js adaptations are evaluated against the source DOM. _"View Source"_ shows
the source HTML, not the result of the adaptation. In situations where you need
to view the rendered DOM, use Firebug or the WebKit inspector. The DOM tab
(labelled 'HTML' or 'Elements') displays a DOM tree that shows the adaptated
DOM. Browse this tree to see the full result of the adaptation.

# Common Issues

Errors Mobify.js encounters during execution are logged to the JavaScript
console. You can view these errors using Webkit Inspector or Firebug. If things
don't appear to be working, we suggest starting there!

## Page is blank, doesn't render at all

Usually this will be accompanied by the error message:

    Uncaught SyntaxError: Unexpected string.

**Solution:** Ensure that you have a comma after every key within your konf, ie.

    'header': {
        ...
    }, // Commas between each key are required
    'content': {

    },

## "{some-key}" displayed on the page

When a variable is rendered to the page instead of parsed with data from
your konf, this likely means you have used an illegal character in the key.

**Solution:** Don't use illegal characters in keys. This includes almost all
    non-alphanumeric characters, ie. dashes (-), periods (.), commas (,), plus
    signs (+), etc.

# Dust.js Documentation

Mobify.js templates extend the Dust.js JavaScript templating language. For more
advanced examples of the syntax, you might find it helpful to browse the
[Dust documentation](http://akdubya.github.com/dustjs/).

You will likely find there to be differences in terminology and syntax, so we
suggest making sure you're knowledgable about Mobify.js templates before doing
so.
