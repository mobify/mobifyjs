define(["./mobifyjs"], function(Mobify) {
    var config = Mobify.config = Mobify.config || {};

    // configFile my already exists if rendering server side, so only grab mobify.js script tag 
    // if configFile is undefined.
    // V6 moved mobify.js to the first script.
    if (!config.configFile) {
        config.configFile = (document.querySelectorAll('script[src*="mobify.js"]')[0] || {}).src || '';
    }
    
    config.configDir = config.cssDir = config.configFile.replace(/\/[^\/]*$/, '/');
    config.imageDir = config.configDir + 'i/';
    config.ajs = Mobify.ajs;

    return config;
});