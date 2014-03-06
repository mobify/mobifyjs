# Mobify Service Clients

Builds a wrapped implementation of the jazzcat and image resizer clients for 
inclusion in MobifyJs 1.1 and used by shims to provide legacy API support.

# Install
    $ npm install -g grunt-cli bower
    $ npm install && bower install

# Build
    $ grunt build

This will create a new build

To update dependencies, change the versions in bower.json, `$ bower install` and
rebuild.
