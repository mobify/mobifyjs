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

    console.log(JSON.stringify(opts));
    console.log("Hi!!!")

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
    var attributeVal = element.getAttribute(options.attribute);
    var url;
    if(attributeVal) {
        url = Utils.absolutify(attributeVal);
        if (Utils.httpUrl(url)) {
            element.setAttribute(options.attribute, CssOptimize.getCssURL(url));
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
          element.getAttribute(opts.attribute)) {
            CssOptimize._rewriteHref(element, opts);
        }
    }
};

var defaults = {
    proto: '//',
    host: 'jazzcat.mobify.com',
    endpoint: 'cssoptimizer',
    projectName: 'oss-' + location.hostname.replace(/[^\w]/g, '-'),
    attribute: 'x-href'
};


return CssOptimize
});