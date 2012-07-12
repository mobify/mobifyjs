---
layout: doc
title: Documentation
---

# Quick Start

Mobify.js is a JavaScript framework for adapting existing websites for tablet and mobile.

1. Download the [mobify-client](https://github.com/mobify/mobify-client):

        sudo npm -g install mobify-client

1. Create a project scaffold and start the Mobify.js development server:

        mobify init myproject && cd myproject && mobify preview

1. Insert the Mobify.js tag after the opening <head> tag on page you'd like to adapt:

        <script>
        (function(window, document, mjs) {

        window.Mobify = {points: [+new Date], tagVersion: [1, 0]};

        var isMobile = /ip(hone|od|ad)|android|blackberry.*applewebkit/i.test(navigator.userAgent)
          , optedOut = /mobify-path=($|;)/.test(document.cookie);

        if (!isMobile || optedOut) {
            return;
        }

        document.write('<plaintext style="display:none">');

        setTimeout(function() {
            var mobifyjs = document.createElement('script')
              , script = document.getElementsByTagName('script')[0];

            mobifyjs.src = mjs;
            script.parentNode.insertBefore(mobifyjs, script);
        });

        })(this, document, 'http://127.0.0.1:8080/mobify.js');
        </script>

1. Set your browser's User Agent to "iPhone":

    * [In Chrome use the User-Agent Switcher plugin](https://chrome.google.com/webstore/detail/djflhoibgkdhkhhcedjiklpkjnoahfmg)
    * In Safari Develop > User Agent > iPhone

1. Navigate to your page. If the demo gods are kind, you'll see this:

    * <img src="data:image/jpeg;base64,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" />

# How it works:

Mobify.js uses a technique called **client side adaptation** to remix HTML on the browser. The remixed content is interrupted by the browser as if the server had sent it in the first place!

The **Mobify.js tag** bootstraps the adaptation and loads the **Mobify.js file** which performs it. The tag activates for iOS, Android and BlackBerry browsers. By default, the Mobify.js file is loaded from the development server.

The development server is part of the **Mobify Client**, a command line tool for building Mobify.js projects. It compiles the Mobify.js file dynamically per request. The file contains two parts, the **Mobify.js API** and site specific adaptations.

Adaptations are expressed as a series of DOM operations on the **source DOM**, the DOM constructed from the page's original HTML. Selected elements can be stored in a context which is then passed to a template. The rendered template is output to the browser!

# Where to next?

* [See how to change the scaffold files in "Getting Started"generated in the "Getting Started"](./getting-started/)
* [Learn about how to adapt your site using DOM operations in "Understanding the Konf"](./understanding-konf/)
* [See how templates can be used to control the adaptation in "Understanding Templates"](./understanding-templates/)
* [Read tips for debugging Mobify.js in the Appendix](./appendix/)