# Mobify.js

Mobify.js is an open source library for improving responsive sites
by providing responsive images, JS/CSS optimization, Adaptive
Templating and more. Mobify.js also provides a 
"Capturing" API for manipulating the DOM before any resources have
loaded, giving developers the ability to enable the listed features above
without changing any backend markup.

For instructions on how to use the library, follow the instructions on [mobifyjs.com](http://www.mobifyjs.com/)
or build the docs site manually in the instructions below.

## Development

### Building

Mobify.js uses Bower, Grunt.js and Require.js to build the library, and manage all of the dependencies. First, you will need to install the grunt-cli globally:

    npm install -g grunt-cli

And then download the latest code from git and install the dependancies:

    git checkout https://github.com/mobify/mobifyjs.git
    cd mobifyjs
    npm install
    bower install

Now, to build the library, simply run the following command:

    grunt build

Open the `build` folder to see the generated Mobify.js libraries.

Mobify.js is built with AMD modules using almond.js.

In order to build Mobify.js during development without having to run
`grunt build` everytime you change a file, run the following command:
    
    grunt serve

This will run a development server on http://localhost:3000 using connect,
and build the library every time the files in `src` change.

To see how the project is setup to build, open up `Gruntfile.js` and have a look!

#### Build Setup

Require.js is used to build Mobify.js. 

 - src/config.js # The require.js base config for all build mobify.js builds
 - src/mobify-library.js # Defines how to build the full mobify.js library

There is also an example custom build file to make it simple to build a custom
mobify.js library (or to compile the library with executable code):

 - mobify-custom.js.example

To create a custom build, run the following:

    `cp mobify-custom.js.example mobify-custom.js`

Then, run `grunt serve` as normal. The output of the custom build will be
located in `build/custom`.

**Note: We use a `mobifyjs` symlink to resolve paths so they can be the same
locally as they are on the CDN. This can be problematic for Windows.**

### Tests

Tests for Mobify.js are written in QUnit. To run them individually, run
`grunt serve` and then go to `http://localhost:3000/tests/capture.html`
or any other of the QUnit tests in the /tests/ folder.

To run all of the tests in an automated fashion using Phantomjs
(the headless webkit browser) run the following command:

    grunt test

It's also important when developing not to run into any regressions on all of the
supported browsers. The Gruntfile is setup to be able to run qunit tests
on many browsers we support (in order to do this yourself, you will need to set
`SAUCE_USERNAME` and `SAUCE_KEY` in your environment variables).

    grunt saucelabs

## Deploying

By default, the deploy command is set to deploy Mobify.js to cdn.mobify.com. To deploy
here, ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set in your
environment variables.

    grunt deploy

## Browser support

Using Capturing:

 - All Webkit browsers (Safari, Chrome, Netfront, etc)
 - Firefox - version 4 and up
 - Opera - 11 and up (previous versions untested)
 - IE - 10 and up

Not Using Capturing:

Support for using the API without Capturing has not been tested, but it will
at minimum support the browsers listed above (as well, it should cover many 
older browsers)

##  Docs

The compiled documentation for Mobify.js can be found online at [mobifyjs.com](http://www.mobifyjs.com/).

The static site is built with [Jekyll](http://jekyllrb.com/). Run the following commands to get the docs running locally:

    gem install jekyll
    grunt jekyll

Then navigate to http://localhost:4000/mobifyjs/docs/.

