/**
 * cssOptimize - Client code to a css optimization service
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['mobifyjs/utils'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        var Utils = require('../bower_components/mobifyjs-utils/utils.js');
        module.exports = factory(Utils);
    } else {
        // Browser globals (root is window)
        root.CssOptimize = factory(root.Utils);
    }
}(this, function (Utils) {

var CssOptimize = window.cssOptimize = {};

/**
 * Takes an original, absolute url of a stylesheet, returns a url for that
 * stylesheet going through the css service.
 */

CssOptimize.getCssUrl = function(url, options) {
    var opts = Utils.extend({}, defaults, options);
    var bits = [opts.protoAndHost];

    if (opts.projectName) {
        bits.push('project-' + opts.projectName);
    }

    bits.push(opts.endpoint);
    bits.push(url);

    return bits.join('/');
};

/**
 * Rewrite the href of a stylesheet referencing `<link>` element to go through 
 * our service.
 */
CssOptimize._rewriteHref = function(element, options) {
    var attributeVal = element.getAttribute(options.targetAttribute);
    var url;
    if (attributeVal) {
        url = Utils.absolutify(attributeVal);
        if (Utils.httpUrl(url)) {
            element.setAttribute('data-orig-href', attributeVal);
            element.setAttribute(options.targetAttribute,
                                 CssOptimize.getCssUrl(url, options));
            if (options.onerror) {
                element.setAttribute('onerror', options.onerror);
            }
        }
    }
};

/**
 * Takes an array-like object of `<link>` elements
 */
CssOptimize.optimize = function(elements, options) {
    var opts = Utils.extend({}, defaults, options);
    var element;

    for(var i = 0, len = elements.length; i < len; i++) {
        element = elements[i];
        if (element.nodeName === 'LINK' &&
            element.getAttribute('rel') === 'stylesheet' &&
            element.getAttribute(opts.targetAttribute) &&
            !element.hasAttribute('mobify-optimized')) {
            element.setAttribute('mobify-optimized', '');
            CssOptimize._rewriteHref(element, opts);
        }
    }
};

/**
 * An 'error' event handler designed to be set using an "onerror" attribute that
 * will set the target elements "href" attribute to the value of its 
 * "data-orig-href" attribute, if one exists.
 */
var restoreOriginalHref = CssOptimize.restoreOriginalHref = function(event) {
    var origHref;
    event.target.removeAttribute('onerror'); //remove error handler
    if(origHref = event.target.getAttribute('data-orig-href')) {
        event.target.setAttribute('href', origHref);
    }
};

var defaults = CssOptimize._defaults = {
    protoAndHost: '//jazzcat.mobify.com',
    endpoint: 'cssoptimizer',
    projectName: 'oss-' + location.hostname.replace(/[^\w]/g, '-'),
    targetAttribute: 'x-href',
    onerror: 'Mobify.CssOptimize.restoreOriginalHref(event);'
};

return CssOptimize;

}));
