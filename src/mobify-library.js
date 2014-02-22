var Utils = require('./utils');
var Capture = require('./capture');
var ResizeImages = require('./resizeImages');
var Jazzcat = require('./jazzcat');
var CssOptimize = require('./cssOptimize');
var Unblockify = require('./unblockify');

var Mobify = window.Mobify = window.Mobify || {};
Mobify.Utils = Utils;
Mobify.Capture = Capture;
Mobify.ResizeImages = ResizeImages;
Mobify.Jazzcat = Jazzcat;
Mobify.CssOptimize = CssOptimize;
Mobify.Unblockify = Unblockify;
Mobify.api = "2.0"; // v6 tag backwards compatibility change

module.exports = Mobify;