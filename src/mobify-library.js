(function (root, factory) {
    if (typeof require === 'function' && typeof define === 'function' &&
        define.amd) {
        // AMD. Register as an anonymous module.
        require(["mobifyjs/utils", "mobifyjs/capture", "mobifyjs/resizeImages",
               "mobifyjs/jazzcat", "mobifyjs/unblockify",
               "mobifyjs/cssOptimize", "mobifyjs/external/picturefill"],
               factory,
               undefined, true);
               // relPath, forceSync
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        var Utils = require('../bower_components/mobifyjs-utils/utils');
        var Capture = require('./capture');
        var ResizeImages = require('../bower_components/imageresize-client/resizeImages');
        var Jazzcat = require('../bower_components/jazzcat-client/jazzcat');
        var CssOptimize = require('./cssOptimize');
        var Unblockify = require('./unblockify');
        require('./external/picturefill');

        module.exports = factory(Utils, Capture, ResizeImages, Jazzcat,
                                 Unblockify, CssOptimize);
    }
}(this, function(Utils, Capture, ResizeImages, Jazzcat, Unblockify, CssOptimize) {
    var Mobify = window.Mobify = window.Mobify || {};
    Mobify.Utils = Utils;
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;
    Mobify.Jazzcat = Jazzcat;
    Mobify.CssOptimize = CssOptimize;
    Mobify.Unblockify = Unblockify;
    Mobify.api = "2.0"; // v6 tag backwards compatibility change
    return Mobify;

}));
