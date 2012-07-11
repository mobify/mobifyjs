Mobify.js
=========

This repository is where we keep the core Mobify.js API. But in order to build/run Mobify.js, 
you need the Mobify Client, which includes this repository as many submodules (one submodule for 
each version). You can find this repository here, which includes instructions on how to develop 
and contribute to the Mobify.js project:

https://github.com/mobify/mobify-client/

For information on using Mobify.js see [http://cloud.mobify.com/](http://cloud.mobify.com/).

Documention
===========

The documentation lives on mobifyjs.com, which is created using the static site generator Jekyll.
In order to view the documentation, you need RubyGems.

    cd www/src
    gem install jekyll
    jekyll --server --auto
    
Then navigate to http://localhost:4000/mobifyjs/docs/
