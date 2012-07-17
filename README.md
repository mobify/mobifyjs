# Mobify.js

Mobify.js is a client side adaptation framework for quickly adapting 
websites to support mobile and tablet devices.

This repository contains the Mobify.js core. The [Mobify Client](https://github.com/mobify/mobify-client/)
is required to compile the core.

To get started with Mobify.js, follow the instructions on [mobifyjs.com](https://www.mobifyjs.com/).

## Install

    make

## Tests

Running the tests requires [PhantomJS](http://phantomjs.org/):

    make test

##  Docs

The compiled documentation for Mobify.js can be found online at [mobifyjs.com](https://www.mobifyjs.com/).

To compile the documentation yourself, install [Jekyll](http://jekyllrb.com/)
and run it from `www` folder:

    gem install jekyll
    cd www
    jekyll --server --auto
    
Then navigate to http://localhost:4000/mobifyjs/docs/.
