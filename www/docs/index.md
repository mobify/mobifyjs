---
layout: doc
title: Mobify.js Framework Documentation
description:
    Find all necessary documentation for Mobify.js, an open source web
    framework from Mobify that helps you adapt any website to support any device.
---

# Quick Start

Mobify.js is a JavaScript framework for adapting websites for tablet and mobile.

1. Install <a href="http://nodejs.org/">Node.js</a> if you don't have it already.

1. Download the [Mobify Client](https://github.com/mobify/mobify-client):

        sudo npm -g install mobify-client

1. Create a project scaffold and start the Mobify.js development server:

        mobify init myproject
        cd myproject
        mobify preview

## Install the Mobify.js Tag

Insert the Mobify.js tag **immediately** after the opening _<head>_ tag on the
website you want to adapt:

{% include paid_warning.html %}

    <script>
    (function(window, document, mjs) {

    window.Mobify = {points: [+new Date], tagVersion: [1, 0]};

    var isMobile = /ip(hone|od|ad)|android|blackberry.*applewebkit|bb1\d.*mobile/i.test(navigator.userAgent);
    var optedOut = /mobify-path=($|;)/.test(document.cookie);

    if (!isMobile || optedOut) {
        return;
    }

    document.write('<plaintext style="display:none">');

    setTimeout(function() {
        var mobifyjs = document.createElement('script');
        var script = document.getElementsByTagName('script')[0];

        mobifyjs.src = mjs;
        script.parentNode.insertBefore(mobifyjs, script);
    });

    })(this, document, 'http://127.0.0.1:8080/mobify.js');
    </script>

## Preview your mobile site

1. Set your browser's User Agent to "iPhone":

    * In Chrome, open Webkit Inspector, click the gear in the bottom right, then
      the _"User agent"_ tab. Check _"Override User Agent"_ then select _"iPhone"_
      from the dropdown.
    * In Safari click _"Develop"_ > _"User Agent"_ > _"iPhone"_
    * In Firefox download the [User Agent Switcher](https://addons.mozilla.org/en-US/firefox/addon/user-agent-switcher/) extension.

1. Navigate to your page. If the demo gods are kind, you'll see this:

<div class="illustration">
    <img src="/mobifyjs/static/img/init.min.png">
</div>

## How it works:

Mobify.js uses a technique called **client side adaptation** to remix HTML in
the browser. The remixed content is interpreted by the browser as if the server
had sent it in the first place!

The **Mobify.js tag** bootstraps the adaptation and loads the **Mobify.js file**,
which performs it. The tag activates in iOS, Android and BlackBerry browsers.
By default, the Mobify.js file is loaded from the development server.

The development server is part of the **Mobify Client**, a command line tool for
building Mobify.js projects. It compiles the Mobify.js file dynamically per
request. The file contains two parts, the **Mobify.js API** and site specific
adaptations.

Adaptations are expressed as a series of operations on the **source DOM**, the
DOM constructed from the page's original HTML. HTML Elements can be selected,
then rendered with a template. Finally, the rendered template is written to the
browser.

## Where to next?

* [See how to change the generated scaffold files in "Getting Started"](./getting-started/)
* [Learn about how to adapt your site using DOM operations in "Understanding the Konf"](./understanding-konf/)
* [See how templates can be used to control the adaptation in "Understanding Templates"](./understanding-templates/)
* [Read tips for debugging Mobify.js in the Appendix](./appendix/)
