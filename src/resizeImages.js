(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['mobifyjs/utils'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('./utils.js'));
    } else {
        // Browser globals (root is window)
        root.ResizeImages = factory(root.Utils);
    }
}(this, function (Utils) {

var ResizeImages = window.ResizeImages = {};

var localStorageWebpKey = 'Mobify-Webp-Support-v2';

function persistWebpSupport(supported) {
    if (Utils.supportsLocalStorage()) {
        var webpSupport = {
            supported: supported,
            date: Date.now()
        };
        localStorage.setItem(localStorageWebpKey, JSON.stringify(webpSupport));
    }
}

/**
 * Synchronous WEBP detection using regular expressions
 * Credit to Ilya Grigorik for WEBP regex matching
 * https://github.com/igrigorik/webp-detect/blob/master/pagespeed.cc
 * Modified to exclude Android native browser on Android 4
 */
ResizeImages.userAgentWebpDetect = function(userAgent){
    var supportedRe = /(Android\s|Chrome\/|Opera9.8*Version\/..\.|Opera..\.)/i;
    var unsupportedVersionsRe = new RegExp('(Android\\s(0|1|2|3|(4(?!.*Chrome)))\\.)|(Chrome\\/[0-8]\\.)' +
                                '|(Chrome\\/9\\.0\\.)|(Chrome\\/1[4-6]\\.)|(Android\\sChrome\\/1.\\.)' +
                                '|(Android\\sChrome\\/20\\.)|(Chrome\\/(1.|20|21|22)\\.)' +
                                '|(Opera.*(Version/|Opera\\s)(10|11)\\.)', 'i');

    // Return false if browser is not supported
    if (!supportedRe.test(userAgent)) {
        return false;
    }

    // Return false if a specific browser version is not supported
    if (unsupportedVersionsRe.test(userAgent)) {
        return false;
    }
    return true;
};

/**
 * Asychronous WEB detection using a data uri.
 * Credit to Modernizer:
 * https://github.com/Modernizr/Modernizr/blob/fb76d75fbf97f715e666b55b8aa04e43ef809f5e/feature-detects/img-webp.js
 */
ResizeImages.dataUriWebpDetect = function(callback) {
    var image = new Image();
    image.onload = function() {
        var support = (image.width === 1) ? true : false;
        persistWebpSupport(support);
        if (callback) callback(support);
        };
    // this webp generated with Mobify image resizer from 
    // http://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png passed 
    // through the Mobify Image resizer: 
    // http://ir0.mobify.com/webp/http://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png
    image.src = 'data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQABgBwlpAADcAD+/gbQAA==';
}

/**
 * Detect WEBP support sync and async. Do our best to determine support
 * with regex, and use data-uri method for future proofing.
 * (note: async test will not complete before first run of `resize`,
 * since onload of detector image won't fire until document is complete)
 * Also caches results for WEBP support in localStorage.
 */
ResizeImages.supportsWebp = function(callback) {

    // Return early if we have persisted WEBP support
    if (Utils.supportsLocalStorage()) {
        
        // Check if WEBP support has already been detected
        var webpSupport;
        var storedSupport = localStorage.getItem(localStorageWebpKey);

        // Only JSON.parse if storedSupport is not null, or else things
        // will break on Android 2.3
        storedSupport && (webpSupport = JSON.parse(storedSupport));
        
        // Grab previously cached support value in localStorage.
        if (webpSupport && (Date.now() - webpSupport.date < 604800000)) {
            return webpSupport.supported;
        }
    }

    // Run async WEBP detection for future proofing
    // This test may not finish running before the first call of `resize`
    ResizeImages.dataUriWebpDetect(callback);

    // Run regex based synchronous WEBP detection
    var support = ResizeImages.userAgentWebpDetect(navigator.userAgent);

    persistWebpSupport(support);

    return support;

};

/**
 * Returns a URL suitable for use with the 'ir' service.
 */
ResizeImages.getImageURL = function(url, options) {
    var opts = options;
    if (!opts) {
        opts = ResizeImages.processOptions();
    }
    var bits = [opts.proto + opts.host];

    if (opts.projectName) {
        var projectId = "project-" + opts.projectName;
        bits.push(projectId);
    }

    if (opts.cacheHours) {
        bits.push('c' + opts.cacheHours);
    }

    if (opts.format) {
        bits.push(opts.format + (opts.quality || ''));
    }

    if (opts.maxWidth) {
        bits.push(opts.maxWidth);

        if (opts.maxHeight) {
            bits.push(opts.maxHeight);
        }
    }

    bits.push(url);
    return bits.join('/');
};

/**
 * Replaces src attr of passed element with value of running `getImageUrl` on it
 * Allows overriding of img.getAttribute(x-src) with srcVal
 */

ResizeImages._rewriteSrcAttribute = function(element, opts, srcVal){
    srcVal = element.getAttribute(opts.sourceAttribute) || srcVal;
    if (srcVal) {
        var url = Utils.absolutify(srcVal);
        if (Utils.httpUrl(url)) {
            if (opts.onerror) {
                element.setAttribute('onerror', opts.onerror);
            }
            element.setAttribute(opts.targetAttribute, ResizeImages.getImageURL(url, opts));
            element.setAttribute('data-orig-src', srcVal);
            // if using resize when not capturing, remove the sourceAttribute
            // as long as it's not "src", which is the target attribute used
            // when not capturing.
            if (!capturing && opts.sourceAttribute != opts.targetAttribute) {
                element.removeAttribute(opts.sourceAttribute);
            }
        }
    }
};

/**
 * Modifies src of `<source />` children of a `<picture>` element to use image 
 * resizer
 */
ResizeImages._resizeSourceElement = function(element, opts, rootSrc) {
    // Grab optional width override
    var width = element.getAttribute('data-width');
    var localOpts = opts;
    if (width) {
        localOpts = Utils.clone(opts);
        localOpts.maxWidth = width;
    }
    // pass along rootSrc if defined on `picture` element
    ResizeImages._rewriteSrcAttribute(element, localOpts, rootSrc);
};

/**
 * Takes a picture element and calls _resizeSourceElement on its `<source />` 
 * children
 */
ResizeImages._crawlPictureElement = function(el, opts) {
    var sources = el.getElementsByTagName('source');
    // If source elements are erased from the dom, leave the
    // picture element alone.
    if (sources.length === 0 || el.hasAttribute('mobify-optimized')) {
        return;
    }
    el.setAttribute('mobify-optimized', '');

    // Grab optional `data-src` attribute on `picture`.
    // Used for preventing writing the same src multiple times for
    // different `source` elements.
    var rootSrc = el.getAttribute('data-src');

    // resize the sources
    for(var i =  0, len = sources.length; i < len; i++) {
        ResizeImages._resizeSourceElement(sources[i], opts, rootSrc);
    }
};

/**
 * Searches a list of target dimensions for the smallest one that is greater than 
 * the passed value and return it, or return the greatst value if none are 
 * greater.
 *
 * Popular device resolutions: 
 * iPhone 3Gs - 320x480
 * iPhone 4 - 640x960
 * iPhone 5 - 650x1156
 * 
 * Galaxy SIII/Nexus 4/Nexus 7 - 720x1280
 * Galaxy SIV/Nexus 5 - 1080x1920
 * 
 * iPad (non-retina) - 1024x768
 * iPad (retina) - 2048x1536
 *
 * A larger list of target dimensions would include 720px, 800px, 1024px, 1280px 
 * and 1920px but they have been omitted due tot heir proximity to other, larger 
 * values
 */
var targetDims = [320, 640, 768, 1080, 1536, 2048, 4000];
ResizeImages._getBinnedDimension = function(dim) {
    var resultDim = 0;

    for (var i = 0, len = targetDims.length; i < len; i++) {
        resultDim = targetDims[i];
        if (resultDim >= dim) {
            break;
        }
    }
    return resultDim;
};

/**
 * Processes options passed to `resize()`. Takes an options object that 
 * potentially has height and width set in css pixels, returns an object where 
 * they are expressed in device pixels, and other default options are set.
 */
ResizeImages.processOptions = function(options) {
    var opts = Utils.clone(ResizeImages.defaults);
    if (options) {
        Utils.extend(opts, options);
    }

    var dpr = opts.devicePixelRatio || window.devicePixelRatio;

    var screenSize = Utils.getPhysicalScreenSize(dpr);

    // If maxHeight/maxWidth are not specified, use screen dimensions
    // in device pixels
    var width = opts.maxWidth || ResizeImages._getBinnedDimension(screenSize.width);
    var height = opts.maxHeight || undefined;

    // Otherwise, compute device pixels
    if (dpr && opts.maxWidth) {
        width = width * dpr;
        if (opts.maxHeight) {
            height = height * dpr;
        }
    }

    // round up in case of non-integer device pixel ratios
    opts.maxWidth = Math.ceil(width);
    if (opts.maxHeight && height) {
        opts.maxHeight = Math.ceil(height);
    }

    if (!opts.format && opts.webp) {
        opts.format = "webp";
    }

    return opts;
};

/**
 * Searches the collection for image elements and modifies them to use
 * the Image Resize service. Pass `options` to modify how the images are 
 * resized.
 */
ResizeImages.resize = function(elements, options) {
    var opts = ResizeImages.processOptions(options);

    for(var i=0; i < elements.length; i++) {
        var element = elements[i];

        // For an `img`, simply modify the src attribute
        if (element.nodeName === 'IMG' && !element.hasAttribute('mobify-optimized')) {
            element.setAttribute('mobify-optimized', '');
            ResizeImages._rewriteSrcAttribute(element, opts);
        }
        // For a `picture`, (potentially) nuke src on `img`, and
        // pass all `source` elements into modifyImages recursively
        else if (element.nodeName === 'PICTURE') {
            ResizeImages._crawlPictureElement(element, opts);
        }
    }

    return elements;
};

ResizeImages.restoreOriginalSrc = function(event) {
    var origSrc;
    event.target.removeAttribute('onerror'); // remove ourselves
    origSrc = event.target.getAttribute('data-orig-src')
    if (origSrc) {
        event.target.setAttribute('src', origSrc);
    }
};

var capturing = window.Mobify && window.Mobify.capturing || false;

ResizeImages.defaults = {
      proto: '//',
      host: 'ir0.mobify.com',
      projectName: "oss-" + location.hostname.replace(/[^\w]/g, '-'),
      sourceAttribute: "x-src",
      targetAttribute: (capturing ? "x-src" : "src"),
      webp: ResizeImages.supportsWebp(),
      onerror: 'ResizeImages.restoreOriginalSrc(event);'
};

return ResizeImages;

}));
