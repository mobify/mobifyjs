/**
 * cssOptimize - Client code to a css optimization service
 */

define(["utils"], function(Utils) {

var CssOptimize = window.cssOptimize = {};

var absolutify = document.createElement("a");

/**
 * Takes an original, absolute url of a stylesheet, returns a url for that
 * stylesheet going through the css service.
 */

CssOptimize.getCssURL = function(url, options) {
    var opts = Utils.extend({}, defaults, options);
    var bits = [opts.proto + opts.host];

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
    if(attributeVal) {
        element.setAttribute('data-orig-href', url);
        element.setAttribute('onerror', options.onerror);
        url = Utils.absolutify(attributeVal);
        if (Utils.httpUrl(url)) {
            element.setAttribute(options.targetAttribute,
                                 CssOptimize.getCssURL(url));
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
            element.getAttribute(opts.targetAttribute)) {

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
    if(origSrc = event.target.getAttribute('data-orig-href')) {
        event.target.setAttribute('href', origHref);
    }
};

var defaults = {
    proto: '//',
    host: 'jazzcat.mobify.com',
    endpoint: 'cssoptimizer',
    projectName: 'oss-' + location.hostname.replace(/[^\w]/g, '-'),
    targetAttribute: 'x-href',
    onerror: 'CssOptimize.restoreOriginalHref(event);'
};

return CssOptimize;
});