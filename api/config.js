/**
 * Store where we were loaded from to allow assets relative to this file.
 */
(function(Mobify) {

var config = Mobify.config = Mobify.config || {}
    
    // If we are loading a custom bundle, then we're debugging.
  , match = /mobify-path=([^&;]*)/g.exec(document.cookie);

config.isDebug = match && match[1] ? 1 : 0;

// The location of this script eg. http://localhost:8080/mobify.js
if (!config.configFile) {
    config.configFile = Mobify.$('script[src*="mobify.js"]').first().attr('src') || '';
}

config.configDir = config.configFile.replace(/\/[^\/]*$/, '/');

config.ajs = Mobify.ajs;

})(Mobify);