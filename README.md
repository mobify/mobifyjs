# Mobify.js

Mobify.js is an open source library for improving the performance of responsive 
sites, as well as for creating new sites using Adaptive Templating. 

Mobify.js contains an API called "Capturing", which enables you to manipulate the DOM
before any resources have downloaded, which unlocks the ability to do resource
control, conditional loading, image resizing, javascript  concatination and
more, all without changing any existing backend markup. Many of these APIs
can also work without Capturing with some modifications to your backend.

For instructions on how to use the library, follow the instructions on [mobifyjs.com](https://www.mobifyjs.com/)
or build the docs site manually in the instructions below.

## Development

### Building

Mobify.js uses Grunt.js and Require.js to build the library, and manage all of the dependancies. First, you will need to install the grunt-cli globally:

    npm install -g grunt-cli

And then download the latest code from git and install the dependancies:

    git checkout https://github.com/mobify/mobifyjs.git
    cd mobifyjs
    npm install

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
on many browsers we support (in order to do this yourself, you will need a
Saucelabs Connect username and key).

    cp localConfig.js.example localConfig.js
    # Add your Saucelabs username and key to localConfig.js
    grunt saucelabs

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

The compiled documentation for Mobify.js can be found online at [mobifyjs.com](https://www.mobifyjs.com/).

The static site is build with [Jekyll](http://jekyllrb.com/). Run the following commands to get the docs running locally:

    gem install jekyll
    grunt jekyll

Then navigate to http://localhost:4000/mobifyjs/docs/.
