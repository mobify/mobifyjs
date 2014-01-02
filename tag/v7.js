window.Mobify = window.Mobify || {};

(function(window, document, Mobify) {

// Mobify.points records timing information. We record
// time-to-first byte in the tag.
Mobify.points = [Date.now()];

// Mobify.tagVersion is the current tag version.
Mobify.tagVersion = [7, 0];

// Mobify.userAgent is the current user agent.
// We store it here so it can easily be override for testing purporses.
Mobify.userAgent = window.navigator.userAgent;

// Mobify.previewUrl is preview API endpoint.
Mobify.previewUrl = "https://preview.mobify.com/v7/";

// Mobify.debug is a wrapper for console.log
// Ideally, this will be compiled out during a build step.
Mobify.debug = function(line) {
    if (console.log) {
        console.log(line);
    }
};

// Mobify.loadScript loads a script with attributes in `options`
// asynchronously. The script is inserted in the DOM before the Mobify
// tag.
Mobify.loadScript = function(options) {
    var mobifyTagScript = document.getElementsByTagName('script')[0];

    var script = document.createElement('script');
    for (prop in options) {
        if (/onerror|onload|src|id/.test(prop)) {
            script[prop] = options[prop];
        } else {
            script.setAttribute(prop, options[prop]);
        }
    }
    mobifyTagScript.parentNode.insertBefore(script, mobifyTagScript);
};

// Mobify.startCapture begins the capturing process, and at the end
// calls the callback.
Mobify.startCapture = function(callback) {
    var self = this;

    document.write('<plaintext style="display:none">');

    setTimeout(function() {
        Mobify.capturing = true;

        callback.call(self);
    }, 0);
};

// Mobify.getCookie fetches the values of a cookie by the given `name`
Mobify.getCookie = function(name) {
    var re = new RegExp("(^|; )" + name + "=([^;]*)");
    var match = document.cookie.match(re);
    if (match) {
        return match[2];
    }
};

// Mobify.isDisabled checks if we are *completely* disabled.
// If so, we don't capture nor load any scripts.
Mobify.isDisabled = function() {
    return /mobify=0/.test(document.cookie);
};

// Mobify.isPreview checks to see if we need to load the preview API.
Mobify.isPreview = function() {
    return !!(this.getCookie("mobify-preview") || 
            /mobify-preview/.test(window.location.hash));
};

// Mobify.loadPreview loads the preview API.
Mobify.loadPreview = function() {
    this.loadScript({
        src: this.previewUrl
    });
};


// Mobify.disable temporarily disables the tag for 5 minutes.
Mobify.disable = function() {
    var now = new Date();
    // Set now to 5 minutes ahead
    now.setTime(now.getTime() + 5*60*1000);
    
    document.cookie = 'mobify=0' +
            '; expires=' + now.toGMTString() +
            '; path=/';

    // Reload the page (location.reload has problems in FF)
    window.location = window.location.href;
};

// Mobify.collectTiming collects DOMContentLoaded time,
// and Load time.
Mobify.collectTiming = function() {
    if (window.addEventListener) {
        window.addEventListener('DOMContentLoaded', function() {
            Mobify.DOMContentLoadedTime = Date.now();
        }, false);
        window.addEventListener('load', function() {
            Mobify.LoadTime = Date.now();
        }, false);
    }
};

// Mobify.supportedBrowser will return whether or not we are on a device
Mobify.supportedBrowser = function() {
    // We're enabled for:
    // - WebKit based browsers
    // - IE 10+
    // - FireFox 4+
    // - Opera 11+
    // - 3DS
    match = /webkit|(firefox)[\/\s](\d+)|(opera)[\s\S]*version[\/\s](\d+)|(trident)[\/\s](\d+)|3ds/i.exec(navigator.userAgent);
    if (!match) {
        return false;
    }
    // match[1] == Firefox
    if (match[1] && +match[2] < 4) {
        return false;
    }
    // match[3] == Opera
    if (match[3] && +match[4] < 11) {
        return false;
    }
    // match[5] == IE
    if (match[5] && +match[6] < 6) {
        return false;
    }

    return true;
}



Mobify.getOptions = function(){
    var self = this;
    var options = self.options;
    if (!options) {
        return;
    }

    // if the "options" objects has a mode, grab the mode and return the options
    // set for that mode
    if ('getMode' in options) {
        var mode = self.getCookie("mobify-mode") || options.getMode(Mobify);
        return options[mode];
    // if there is no mode set, return the options object if the browser is
    // supported, or if we're not capturing
    } else if (options.capture === false || Mobify.supportedBrowser()){
        return options
    }

    return undefined;
}

// Mobify.init initializes the tag with the `options`.
//
// Format of `options` object:
// Mobify.init({
//     // Whether we should allow load through preview.
//     skipPreview: true 

//     getMode: function(Mobify) {
//         // Return mode based on device or other settings.
//         // `mode` is a key in to the options object
//         // that selects our device-specific options.
//         return 'desktop'
//     },

//     desktop: {
//         // Url to load
//         url: "http://cdn.mobify.com/foo/mobify.js",

//         // Whether to capture
//         capture: true,

//         // Prelab Callback (optional)
//         // Called immediately before we insert the script.
//         preload: function() {};

//         // Postload Callback (optional)
//         // Called after the script's onload handler fires.
//         postload: function() {};
//     }
// });
Mobify.init = function(options) {
    var self = this;
    self.options = options;

    self.debug("Init Called");

    if (self.isDisabled()) {
        self.debug("Tag is disabled.");
        return;
    }

    self.collectTiming();

    if (!options.skipPreview && self.isPreview()) {
        self.startCapture(function(){self.loadPreview()});
        return;
    }

    var opts = Mobify.getOptions();

    if (typeof opts === "undefined") {
        self.debug("No mode options found, acting disabled.")
        return;
    }

    var preloadCallback = function() {
        if (opts.preload) {
            opts.preload(self);
        }
    };

    var postloadCallback = function() {
        if (opts.postload) {
            Mobify.debug("Post Load Callback Firing");
            Mobify.postload = opts.postload;
            opts.postload(self);
        }
    };

    var load = function() {
        preloadCallback();

        var options = {
            id: "mobify-js",
            src: opts.url,
            'class': "mobify",
            onerror: function() {self.disable()},
            onload: postloadCallback
        }

        self.loadScript(options);
    };

    // default capture to true
    if (opts.capture === false) {
        load();
    } else {
        self.startCapture(load);
    }
};

})(window, document, window.Mobify);
