var Mobify = {};

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

Mobify.isDisabled = function() {
    return /mobify=0/.test(document.cookie);
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

    var mobifyjsUrl = options.url;

    if (self.isDisabled()) {
        return;
    }

    self.startCapture(function() {
        self.loadScript({
            id: "mobify-js",
            src: mobifyjsUrl,
            class: "mobify",
            onerror: function() {self.disable()}
        });
    });
};

