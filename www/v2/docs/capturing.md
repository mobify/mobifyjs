---
layout: docv2
title: Mobify.js Documentation
---

# Capturing

To use the Capturing API, you must first install the Mobify.js tag on your site.
If you have not already, please refer to the  [quickstart guide](/mobifyjs/v2/docs/) to get setup.

* TOC
{:toc}

## `Capture.init([document], [prefix="x-"])`

__document__ and __prefix__ are optional.

Creates a new instance of a `capture` object, which will parse the
existing document in order to create an entirely new `captured document`,
which is an exact replica of the original document, but with certain
properties prepended with a prefix to prevent resources from loading.

### Modified elements/attributes

- element: **img**, attributes: **src**
- element: **iframe**, attributes: **src**
- element: **script**, attributes: **src, type**
- element: **link**, attributes: **href**
- element: **style**, attributes: **media**

**Example**

    // Change src of first script
    var capture = Mobify.Capture.init();
    var script = capturedDoc.getElementsByTagName("script")[0];
    // Must use x-src, not src
    script.setAttribute("x-src", "/path/to/script.js");
    capture.renderCapturedDoc();

### Useful properties

- `capture.doc` - Original document being captured
- `capture.prefix` - Prefix used to prevent resource loading
- `capture.doctype` - Doctype of captured document
- `capture.htmlOpenTag` - String of opening &lt;html&gt; tag
- `capture.headOpenTag` - String of opening &lt;head&gt; tag
- `capture.bodyOpenTag` - String of opening &lt;body&gt; tag
- `capture.htmlEl` - Reference to html element of captured doc
- `capture.headEl` - Reference to head element of captured doc
- `capture.bodyEl` - Reference to body element of captured doc
- `capture.capturedDoc` - Captured document object

## `getCapturedDoc()`

Returns a reference to the `captured document` inside of a `capture`
object.

You have access to all DOM API methods on the `captured document`.

**Usage/Example:**

    var capture = Mobify.Capture.init();
    var capturedDoc = capture.getCapturedDoc();
    var paragraphs = capturedDoc.querySelectorAll("p");

## window.capturing

`window.capturing` is an indicator of the state that your code is running. Mobify.js is executed both during capturing, and after capturing.
First it stops the original document from rendering (at this time
`window.capturing` is true). After rendering the captured document,
Mobify.js is run again in a non-capturing context (at this time
`window.capturing` is false).

**Usage/Example:**

    var capturing = window.capturing || false;
    if (capturing) {
        console.log("Executing during capturing phase!");
        var capture = Mobify.Capture.init();
        capture.renderCapturedDoc();
    else {
        console.log("Executing during post-capturing phase!");
    }


## `escapedHTMLString()`

Returns a string representation of the `captured document`, but with
all resources enabled (prefix removed). Can be considered an
alternative to `capturedDoc.outerHTML`.

**Usage/Example:**

    var capture = Mobify.Capture.init();
    var htmlString = capture.escapedHTMLString();

## `render(htmlString)`

Opens the original `document` and renders it from a clean slate
with the htmlString.

**Usage/Example:**

    var capture = Mobify.Capture.init();
    capture.render("<html><body><h1>Test!</h1></body></html>");

__Note: This method is async__

## `renderCapturedDoc()`

Writes out the captured document to the original document.

**Usage/Example:**

    var capture = Mobify.Capture.init();
    // Removes all scripts
    var scripts = capturedDoc.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        script.parentNode.removeChild(script);
    }
    capture.renderCapturedDoc();

__Note: This method is async__

## `restore()`

Restores the original document after using capturing.

__Note: This method is async__

**Usage/Example:**

    var capture = Mobify.Capture.init();
    if (/ipad/i.test(navigator.userAgent)) {
        // Do a bunch of stuff...
    } else {
        // If not iPad, just restore everything back to normal
        capture.restore();
    }

## Browser Support


| Browser                      | Version |
|------------------------------|---------|
| Webkit (Safari, Chrome, etc) | ---     |
| Firefox                      | 4.0+    |
| Opera                        | 11.0+   |
| Internet Explorer            | 10+     |
