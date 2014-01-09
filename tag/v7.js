window.Mobify = window.Mobify || {};
window.Mobify.Tag = window.Mobify.Tag || {};

(function(window, document, Mobify, Tag) {

// Tag.debug is a wrapper for console.log
// Ideally, this will be compiled out during a build step.
Tag.debug = function(line) {
    if (window.console && window.console.log) {
        console.log(line);
    }
};

// Mobify.points records timing information. We record
// time-to-first byte in the tag.
//
// This property is required by Mobify.js
Mobify.points = [+(new Date())];

// Tag.tagVersion is the current tag version.
// This property is required by Mobify.js
Mobify.tagVersion = [7, 0];

// Tag.userAgent is the current user agent.
// We store it here so it can easily be override for testing purporses.
Tag.userAgent = window.navigator.userAgent;

// previewUrl is preview API endpoint.
Tag.previewUrl = "https://preview.mobify.com/v7/";

// Tag.loadScript loads a script with attributes in `options`
// asynchronously. The script is inserted in the DOM before the Mobify
// tag.
Tag.loadScript = function(options) {
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

// Tag.startCapture begins the capturing process, and at the end
// calls the callback.
Tag.startCapture = function(callback) {
    var self = this;

    document.write('<plaintext style="display:none">');

    setTimeout(function() {
        Mobify.capturing = true;

        callback.call(self);
    }, 0);
};

// Tag.getCookie fetches the values of a cookie by the given `name`
// Returns `undefined` if no cookie matches.
Tag.getCookie = function(name) {
    // Internet Explorer treats empty cookies differently, it does
    // not include the '=', so our regex has to be extra complicated.
    var re = new RegExp("(^|; )" + name + "((=([^;]*))|()(;|$))");
    var match = document.cookie.match(re);
    if (match) {
        return (typeof match[4] === 'string' ? match[4] : match[5]);
    }
};

// Tag.isDisabled checks if we are *completely* disabled.
// If so, we don't capture nor load any scripts.
Tag.isDisabled = function() {
    return this.getCookie('mobify-path') === '';
};

// Tag.isPreview checks to see if we need to load the preview API.
Tag.isPreview = function() {
    return !!((this.getCookie("mobify-path") === 'true') || 
            /mobify-path=true/.test(window.location.hash));
};

// Tag.loadPreview loads the preview API.
Tag.loadPreview = function() {
    this.loadScript({
        src: this.previewUrl
    });
};


// Tag.disable temporarily disables the tag for 5 minutes.
Tag.disable = function() {
    var now = new Date();
    // Set now to 5 minutes ahead
    now.setTime(now.getTime() + 5*60*1000);
    
    document.cookie = 'mobify-path=' +
            '; expires=' + now.toGMTString() +
            '; path=/';

    // Reload the page (location.reload has problems in FF)
    window.location = window.location.href;
};

// Tag.collectTiming collects DOMContentLoaded time,
// and Load time.
Tag.collectTiming = function() {
    if (window.addEventListener) {
        window.addEventListener('DOMContentLoaded', function() {
            Tag.DOMContentLoadedTime = Date.now();
        }, false);
        window.addEventListener('load', function() {
            Tag.LoadTime = Date.now();
        }, false);
    }
};

// Tag.supportedBrowser will return whether or not we are on a device
Tag.supportedBrowser = function(ua) {
    var self = this;

    // We're enabled for:
    // - WebKit based browsers
    // - IE 10+
    // - FireFox 4+
    // - Opera 11+
    match = /webkit|(firefox)[\/\s](\d+)|(opera)[\s\S]*version[\/\s](\d+)|(trident)[\/\s](\d+)/i.exec(ua);
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

// Tag.getOptions returns the current options, accounting for the current
// mode if necessary.
Tag.getOptions = function(){
    var self = this;
    var options = self.options;
    if (!options) {
        return;
    }

    if ('getMode' in options) {
        // If the "options" objects has a mode, grab the mode and
        // return the options set for that mode
        var mode = self.getCookie("mobify-mode") || options.getMode(Mobify);
        return options[mode];
    } else if (self.supportedBrowser(self.userAgent)) {
        // If there is no mode set, return the options object if the browser is
        // supported.
        return options
    }

    return;
}

// Mobify.Tag.init initializes the tag with the `options`.
//
// Format of `options` object:
// Mobify.Tag.init({
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
Tag.init = function(options) {
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

    var opts = self.getOptions();

    if (typeof opts === "undefined") {
        self.debug("No mode options found, acting disabled.");
        return;
    }

    var preloadCallback = function() {
        if (opts.preload) {
            opts.preload(self);
        }
    };

    var postloadCallback = function() {
        if (opts.postload) {
            self.debug("Post Load Callback Firing");
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

    // Default capture to true
    if (opts.capture === false) {
        load();
    } else {
        self.startCapture(load);
    }
};

})(window, document, window.Mobify, window.Mobify.Tag);
