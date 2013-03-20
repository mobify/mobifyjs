define(["utils"], function(Utils) {

var ResizeImages = {}

var absolutify = document.createElement('a')

// A regex for detecting http(s) URLs.
var httpRe = /^https?/

// A protocol relative URL for the host ir0.mobify.com.
var PROTOCOL_AND_HOST = '//ir0.mobify.com'
     
function getPhysicalScreenSize() {
    
    function multiplyByPixelRatio(sizes) {
        var dpr = window.devicePixelRatio || 1;

        sizes.width = Math.round(sizes.width * dpr);
        sizes.height = Math.round(sizes.height * dpr);
        
        return sizes;
    }

    var iOS = navigator.userAgent.match(/iphone|ipod|ipad/i);
    var androidVersion = (navigator.userAgent.match(/android (\d)/i) || {})[1];

    var sizes = {
        width: window.outerWidth
      , height: window.outerHeight
    };

    // Old Android and BB10 use physical pixels in outerWidth/Height, which is what we need
    // New Android (4.0 and above) use CSS pixels, requiring devicePixelRatio multiplication
    // iOS lies about outerWidth/Height when zooming, but does expose CSS pixels in screen.width/height

    if (!iOS) {
        if (androidVersion > 3) return multiplyByPixelRatio(sizes);
        return sizes;
    }

    var isLandscape = window.orientation % 180;

    if (isLandscape) {
        sizes.height = screen.width;
        sizes.width = screen.height;
    } else {
        sizes.width = screen.width;
        sizes.height = screen.height;
    }

    return multiplyByPixelRatio(sizes);
};

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
ResizeImages.resize = function(imgs, options) {
    var opts;
    if (options) {
        opts = Utils.extend(defaults, options);
    } else {
        opts = defaults;
    }
    var dpr = window.devicePixelRatio;

    var screenSize = getPhysicalScreenSize();
    var width = opts.maxWidth || screenSize.width;
    var height = opts.maxHeight || screenSize.height;
    if (dpr) {
        opts.maxWidth = Math.ceil(width * dpr);
        opts.maxHeight = Math.ceil(height * dpr);
    }

    var attr;
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

var defaults = {
      projectName: "",
      attribute: "x-src"
};

return ResizeImages;

});
