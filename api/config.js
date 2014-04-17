(function() {
    var config = Mobify.config = Mobify.config || {};

    // If loaded with preview, set debug, otherwise debug is off.
    var match = /mobify-path=([^&;]*)/g.exec(document.cookie);
    config.isDebug = config.isDebug || (match && match[1] ? 1 : 0);

    // configFile my already exists if rendering server side, so only grab mobify.js script tag 
    // if configFile is undefined.
    // V6 moved mobify.js to the first script.
    if (!config.configFile) {
        config.configFile = Mobify.$('script[src*="mobify.js"]').first().attr('src') || '';
    }
    config.configDir = config.configFile.replace(/\/[^\/]*$/, '/');

    // in the v6 tag, ajs is always defined, but that is not the case for v7 tags,
    // and thus we will make it defined here.
    if (Mobify && Mobify.config && Mobify.config.projectName) {
        Mobify.ajs = Mobify.ajs || '//a.mobify.com/' + Mobify.config.projectName + 'a.js';
    }
    config.ajs = Mobify.ajs;
})();
