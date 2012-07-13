---
layout: doc
title: Mobify.js in Production
---

# Mobify.js in Production

You have created a mobile site using Mobify.js and you want to go live 
with it, or you want to run it on a testing/staging environment.
Excellent! There are just a few steps to make that happen.

## Generating Bundles

When you run the development server in Mobify Client, you are serving a
collection of files, including Mobify.js, which is a combination of your
selections in your `mobify.konf`, your mobile `templates`, and the 
Mobify.js Framework. We refer to this collection of files as a `bundle`.

In Staging/Production, you do not want to be generating bundles on the fly
for each request. Instead, you generate bundles that you can host on 
your own web server.

To do that, issue the following command in your project directory:

    mobify build

Your bundle will be generated and saved in the bld/ directory inside your
project. Copy the bld folder into the location where you keep static
files on your webserver.


## Change the Bundle location in the tag

Now that your bundle is hosted on your webserver, you must change the 
location that your tag points to:

    })(this, document, '/path/to/static/bld/mobify.js');

But this is a problem because now you have to issue the `mobify build` 
command every time you want edit your mobile website. To fix that, you
should conditionally swap the build location depending on your environment. 

For example, you might have this logic similar to this in your backend code:

    MOBIFY_BUNDLE = '/path/to/static/bld/mobify.js'
    if ENVIRONMENT == 'dev':
        MOBIFY_BUNDLE = 'http://127.0.0.1:8080/mobify.js'

And then use this variable in your templates:

    })(this, document, '<%= MOBIFY_BUNDLE %>');

## You're done!

That's all it takes to host Mobify.js in a Production environment. If you
don't want to have to manage these bundles yourself, consider using the 
[Mobify Cloud](https://cloud.mobify.com).


