(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['mobifyjs/utils', 'mobifyjs/capture'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        var Utils = require('../bower_components/mobifyjs-utils/utils.js');
        var Capture = require('./capture.js');
        module.exports = factory(Utils, Capture);
    } else {
        // Browser globals (root is window)
        root.Unblockify = factory(root.Utils, root.Capture);
    }
}(this, function (Utils, Capture) {

var Unblockify = {}

// Moves all scripts to the end of body by overriding insertMobifyScripts
Unblockify.moveScripts = function(scripts, doc) {
    // Remove elements from the document
    Utils.removeElements(scripts, doc);

    for (var i=0,ii=scripts.length; i<ii; i++) {
        var script = scripts[i];
        doc.body.appendChild(script);
    }
};


Unblockify.unblock = function(scripts) {
    // Grab reference to old insertMobifyScripts method
    var oldInsert = Capture.prototype.insertMobifyScripts;

    // Override insertMobifyScripts to also move the scripts
    // to the end of the body
    Capture.prototype.insertMobifyScripts = function() {
        oldInsert.call(this);

        var doc = this.capturedDoc;
        Unblockify.moveScripts(scripts, doc);
    };
};

return Unblockify;

}));
