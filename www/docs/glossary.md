---
layout: doc
title: Glossary | Mobify.js Framework Documentation
---

# Glossary

Attribute

: Additional data values which may be returned along with variables.
Each attribute maps to a specific member key within the parent key
in the konf.

Context

: A set of key-value pairs that is used to provide values for
variables in templates. The Mobify.js konf produces a context,
built from your selections, and renders a template with that
context.
[Learn more about context](../template-reference/#understanding-context).

Keys

: A name that uniquely references a selection you make within the konf
file, also serves as a variable name within your templates.

Konf

: A JavaScript file that enables content selection and template
rendering from a source DOM.

[Jazzcat]({{ site.baseurl }}/docs/jazzcat/)

: A Mobify Cloud feature that improves script loading performance.

Rendered DOM

: The mobile site's post-adaptation DOM, the output of Mobify.js.

Selection

: DOM elements or other data returned by functions defined in the konf
file, provide the values of the variables in templates to produce
the rendered DOM.

Source DOM

: The DOM built from your site's original HTML, without running
JavaScript, ie. the DOM you'd see if you viewed source.

Template

: A text file that contains regular HTML markup and variables that are
replaced when the template is rendered.

Variable

: Context mapped data provided to your template from the konf
selections. Each variable maps to a key in the context.
