define(["utils"], function(Utils) {

var ResizeImages = window.ResizeImages = {};

var absolutify = document.createElement('a');

// A regex for detecting http(s) URLs.
var httpRe = /^https?/;

function getPhysicalScreenSize(devicePixelRatio) {

    function multiplyByPixelRatio(sizes) {
        var dpr = devicePixelRatio || 1;

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
}

var localStorageWebpKey = 'Mobify-Webp-Support';

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
 */
ResizeImages.userAgentWebpDetect = function(userAgent){
    var supportedRe = /(Android\s|Chrome\/|Opera9.8*Version\/..\.|Opera..\.)/i;
    var unsupportedVersionsRe = new RegExp('(Android\\s(0|1|2|3)\\.)|(Chrome\\/[0-8]\\.)' +
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
}

/**
 * Asychronous WEB detection using a data uri.
 * Credit to Modernizer:
 * https://github.com/Modernizr/Modernizr/blob/fb76d75fbf97f715e666b55b8aa04e43ef809f5e/feature-detects/img-webp.js
 */
ResizeImages.dataUriWebpDetect = function(callback) {
    var image = new Image();
    image.onload = function() {
        var support = (image.width == 4) ? true : false;
        persistWebpSupport(support);
        if (callback) callback(support);
        };
    image.src = 'data:image/webp;base64,UklGRjgAAABXRUJQVlA4ICwAAAAQAgCdASoEAAQAAAcIhYWIhYSIgIIADA1gAAUAAAEAAAEAAP7%2F2fIAAAAA';
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
        var webpSupport = JSON.parse(localStorage.getItem(localStorageWebpKey));
        
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
    var opts = Utils.clone(defaults);
    if (options) {
        Utils.extend(opts, options);
    }

    var bits = [opts.proto + opts.host];

    if (opts.projectName) {
        var projectId = "project-" + opts.projectName;
        bits.push(projectId);
    }

    if (options.cacheHours) {
        bits.push('c' + options.cacheHours);
    }

    if (opts.format) {
        bits.push(options.format + (options.quality || ''));
    }

    if (opts.maxWidth) {
        bits.push(options.maxWidth)

        if (opts.maxHeight) {
            bits.push(options.maxHeight);
        }
    }

    bits.push(url);
    return bits.join('/');
};

/**
 * Searches the collection for image elements and modifies them to use
 * the Image Resize service. Pass `options` to modify how the images are 
 * resized.
 */
ResizeImages.resize = function(imgs, options) {
    var opts = Utils.clone(defaults);
    if (options) {
        Utils.extend(opts, options);
    }

    var dpr = opts.devicePixelRatio || window.devicePixelRatio;

    var screenSize = getPhysicalScreenSize(dpr);

    // If maxHeight/maxWidth are not specified, use screen dimentions
    // in device pixels
    var width = opts.maxWidth || screenSize.width;
    var height = opts.maxHeight || screenSize.height;

    // Otherwise, compute device pixels
    if (dpr && opts.maxWidth) {
        width = width * dpr;
        if (opts.maxHeight) {
            height = height * dpr;
        }
    }

    // Doing rounding for non-integer device pixel ratios
    opts.maxWidth = Math.ceil(width);
    opts.maxHeight = Math.ceil(height);

    if (!opts.format && opts.webp) {
        opts.format = "webp";
    }

    // Runs `getImageUrl` on src attr of an img/source element.
    // Allows overriding of img.getAttribute(x-src) with srcVal
    function modifySrcAttribute(img, opts, srcVal){
        var srcVal = img.getAttribute(opts.attribute) || srcVal;
        if (srcVal) {
            absolutify.href = srcVal;
            var url = absolutify.href;
            if (httpRe.test(url)) {
                img.setAttribute(opts.setAttr, ResizeImages.getImageURL(url, opts));
                img.setAttribute('data-orig-src', srcVal);
                if(opts.onerror) {
                    img.setAttribute('onerror', opts.onerror);
                }
            }
        }
    };

    // Inner function used to resize `img` and `picture` elements.
    // Called recursively for picture element.
    function resizeInner(imgs, rootSrc) {
        for(var i=0; i<imgs.length; i++) {
            var img = imgs[i];

            // For an `img`, simply modify the src attribute
            if (img.nodeName === 'IMG') {
                modifySrcAttribute(img, opts);
            }
            // For a `source`, modify the src attribute, and also
            // potentially override the width and src value.
            else if (img.nodeName === 'SOURCE') {
                // Grab optional width override
                var width = img.getAttribute('data-width');
                var localOpts = opts;
                if (width) {
                    localOpts = Utils.clone(opts);
                    localOpts.maxWidth = width;
                }
                // pass along rootSrc if defined on `picture` element
                modifySrcAttribute(img, localOpts, rootSrc);
            }
            // For a `picture`, (potentially) nuke src on `img`, and
            // pass all `source` elements into modifyImages recursively
            else if (img.nodeName === 'PICTURE') {
                var sources = img.getElementsByTagName('source');

                // If source elements are erased from the dom, leave the
                // picture element alone.
                if (sources.length === 0) {
                    continue;
                }

                // Grab optional src attribute on `picture`.
                // Used for preventing writing the same src multiple times for
                // different `source` elements.
                var rootSrc = img.getAttribute('data-src');

                // Recurse on the source elements
                resizeInner(sources, rootSrc);

            }
        }
    };

    resizeInner(imgs);

    return imgs;
};

var capturing = window.Mobify && window.Mobify.capturing || false;

var defaults = {
      proto: '//',
      host: 'ir0.mobify.com',
      projectName: "oss-" + location.hostname.replace(/[^\w]/g, '-'),
      attribute: "x-src",
      webp: ResizeImages.supportsWebp(),
      onerror: 'ResizeImages.restoreOriginalSrc(event);'
};

var restoreOriginalSrc = ResizeImages.restoreOriginalSrc = function(event) {
    var origSrc;
    event.target.removeAttribute('onerror'); // remove ourselves
    if (origSrc = event.target.getAttribute('data-orig-src')) {
        console.log("Restoring " + event.target.src + " to " + origSrc);
        event.target.setAttribute('src', origSrc);
    }
};

defaults.setAttr = (capturing ? defaults.attribute : 'src');

return ResizeImages;

});
