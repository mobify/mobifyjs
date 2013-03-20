---
layout: doc
title: Mobify.js in Production | Mobify.js Framework Documentation
---

# Mobify.js in Production

You have created a mobile site using Mobify.js and you want to go live
with it, or you want to run it on a testing/staging environment.
Excellent! There are just a few steps to make that happen.


##  Compiling Files

In development, Mobify.js files are served dynamically by the
Mobify Client development server. In production, we'd like to serve
these files from a static webserver.

Run the `mobify build` command from root project folder to compile the
project for static serving:

    mobify build

The compiled files are placed inside the _bld_ folder in the root
of your project. Ensure that the build finishes correctly and that the
mobify.js file and all other project assets are in the _bld_ folder then
copy it to the appropriate location on your static webserver.


##  Updating the Mobify.js tag

By default, the Mobify.js tag is configured to load the mobify.js file from
the development server at _http://127.0.0.1:8080/mobify.js_. Alter the path
in the tag to point to the location of the mobify.js file on your static
webserver:

    })(this, document, '/path/to/static/bld/mobify.js');

Typically you'll want to automate this process by including serverside
logic to alter the location depending on your environment:

    MOBIFY_BUNDLE = '/path/to/static/bld/mobify.js'
    if ENVIRONMENT == 'dev':
        MOBIFY_BUNDLE = 'http://127.0.0.1:8080/mobify.js'

And then use this variable in your templates:

    })(this, document, '<%= MOBIFY_BUNDLE %>');

----

## The Mobify Cloud

Once you have a finely-tuned mobile site, let the experts behind Mobify.js help you take it further.

The Mobify Cloud offers a distributed CDN, mobile workflow management, QA testing, automatic image resizing, and smart JavaScript optimization.

<a href="//cloud.mobify.com/" class="btn btn-primary rounded">Try Mobify Cloud for Free</a>
