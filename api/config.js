(function() {
    var config = Mobify.config = Mobify.config || {};

    // If loaded with preview, set debug, otherwise debug is off.
    var match = /mobify-path=([^&;]*)/g.exec(document.cookie);
    config.isDebug = match && match[1] ? 1 : 0;

    // configFile my already exists if rendering server side, so only grab mobify.js script tag 
    // if configFile is undefined.
    // V6 moved mobify.js to the first script.
    if (!config.configFile) {
        config.configFile = Mobify.$('script[src*="mobify.js"]').first().attr('src') || '';
    }
    config.configDir = config.configFile.replace(/\/[^\/]*$/, '/');

    config.imageDir = config.configDir + 'i/';

    config.cssDir = config.configDir;
    config.ajs = Mobify.ajs;
})();