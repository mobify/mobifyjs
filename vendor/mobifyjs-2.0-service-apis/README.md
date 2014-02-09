# Custom MPS Zazzle build 

This is a custom Zazzle build that imports select libraries from Mobify.js,
and imports Grog for performance tracking.

It uses Grunt for building, and Bower for package management.

## Install

    make install

This will install the global grunt-cli, bower, as well as the node packages
specified in package.json for node, and the bower packages specified in
components.json.

## Development

Run the following command to run the development server, which builds mobify.js
upon startup, and whenever files get modified in the `src` folder and in main.js

    grunt serve
