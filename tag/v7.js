var Mobify = {};

Mobify.points = [Date.now()];

Mobify.tagVersion = [7, 0];

Mobify.userAgent = window.navigator.userAgent;

Mobify.previewUrl = "https://preview.mobify.com/v7/";

Mobify.debug = function(line) {
    if (console.log) {
        console.log(line);
    }
};

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

Mobify.startCapture = function(callback) {
    var self = this;

    document.write('<plaintext style="display:none">');

    setTimeout(function() {
        Mobify.capturing = true;

        callback.call(self);
    }, 0);
};

Mobify.getCookie = function(name) {
    var re = new RegExp("(^|; )" + name + "=([^;]*)");
    var match = document.cookie.match(re);
    if (match) {
        return match[2];
    }
};

Mobify.isDisabled = function() {
    return /mobify=0/.test(document.cookie);
};

Mobify.isPreview = function() {
    return /mobify-preview/.test(window.location.hash + " " + document.cookie);
};

Mobify.loadPreview = function() {
    this.loadScript({
        src: this.previewUrl
    });
};

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

Mobify.init = function(options) {
    var self = this;
    self.debug("Init Called");

    if (self.isDisabled()) {
        self.debug("Tag is disabled.");
        return;
    }

    if (self.isPreview()) {
        self.startCapture(function(){self.loadPreview()});
        return;
    }

    var mode = self.getCookie("mobify-mode") || options.getMode(Mobify);
    var opts = options[mode];

    self.debug("Mode is: " + mode);

    if (typeof opts === "undefined") {
        self.debug("No mode options found, acting disabled.")
        return;
    }

    var preloadCallback = function() {
        if (opts.preload) {
            opts.preload(self);
        }
    }

    var postloadCallback = function() {
        if (opts.postload) {
            Mobify.debug("Post Load Callback Firing");
            opts.postload(self);
        }
    }

    var load = function() {
        preloadCallback();

        self.loadScript({
            id: "mobify-js",
            src: opts.url,
            'class': "mobify",
            onerror: function() {self.disable()},
            onload: postloadCallback
        });
    };

    if (opts.capture) {
        self.startCapture(load);
    } else {
        load();
    }
};
