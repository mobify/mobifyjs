define(["utils"], function(Utils) {

var ResizeImages = {}

var absolutify = document.createElement('a')

// A regex for detecting http(s) URLs.
var httpRe = /^https?/

// A protocol relative URL for the host ir0.mobify.com.
var PROTOCOL_AND_HOST = '//ir0.mobify.com'
          
/**
 * Returns a URL suitable for use with the 'ir' service.
 */ 
var getImageURL = ResizeImages.getImageURL = function(url, options) {
    options = options || {}

    var bits = [PROTOCOL_AND_HOST];

    if (defaults.projectName) {
        var projectId = "project-" + defaults.projectName;
        bits.push(projectId);
    }

    if (options.format) {
        bits.push(options.format + (options.quality || ''));
    }

    if (options.maxWidth) {
        bits.push(options.maxWidth)

        if (options.maxHeight) {
            bits.push(options.maxHeight);
        }
    }

    bits.push(url);
    return bits.join('/');
}

/**
 * Searches the collection for image elements and modifies them to use
 * the Image Resize service. Pass `options` to modify how the images are 
 * resized.
 */
var resizeImages = ResizeImages.resize = function(document, options) {
    var opts;
    if (typeof options == 'object') {
        opts = Utils.extend(defaults, options);
    } else {
        opts = defaults;
    }
    var dpr = window.devicePixelRatio;
    var imgs = document.querySelectorAll(opts.selector);
    var attr;

    if (typeof options == 'number') {
        opts.maxWidth = Math.floor(options);
    }

    if (dpr) {
        if (opts.maxWidth) {
            opts.maxWidth = Math.ceil(opts.maxWidth * dpr);
        }

        if (opts.maxHeight) {
            opts.maxHeight = Math.ceil(opts.maxHeight * dpr);
        }
    }

    for(var i=0; i<imgs.length; i++) {
        var img = imgs[i];
        if (attr = img.getAttribute(opts.attribute)) {
            absolutify.href = attr;
            var url = absolutify.href;
            if (httpRe.test(url)) {
                img.setAttribute('x-src', getImageURL(url, opts));
            }
        }
    }
    return imgs;
}

var defaults = resizeImages.defaults = {
        selector: 'img'
      , attribute: 'x-src'
      , projectName: ''
    };

return ResizeImages;

});
