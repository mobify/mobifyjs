(function($, Mobify) {

// Set optout cookie and reload to goto desktop.
// V6.X: mobify-path=
//
// `url`: Optional url to redirect to after opting out.
Mobify.desktop = function(url) {
    document.cookie = 'mobify-path=; path=/;';

    if (url) {
        location = url;
    } else {
        location.reload();
    }
};

// i18n function converts in a list of language types and data and returns
// a function that allows you to grab translation keys from that data
Mobify.i18n = function(list, data) {
    list.push("DEFAULT");

    var i18nlookup = function(key) {
        for(var i = 0; i < list.length; i++) {
            var value = (data[list[i]] ? data[list[i]][key] : undefined);
            if (value) return value;
       }
    }
    return i18nlookup;
};

Mobify.isIOS8_0 = function() {
    var IOS8_REGEX = /ip(hone|od|ad).*OS 8_0/i;

    return IOS8_REGEX.test(window.navigator.userAgent);
};

/**
 * iOS 8.0 has a bug where dynamically switching the viewport (by swapping the
 * viewport meta tag) causes the viewport to automatically scroll. When
 * capturing, the initial document never has an active meta viewport tag.
 * Then, the rendered document injects one causing the aforementioned scroll.
 *
 * Create a meta viewport tag that we inject into the page to force the page to
 * scroll before anything is rendered in the page (this code should be called
 * before document.open!)
 *
 * JIRA: https://mobify.atlassian.net/browse/GOLD-883
 * Open Radar: http://www.openradar.me/radar?id=5516452639539200
 * WebKit Bugzilla: https://bugs.webkit.org/show_bug.cgi?id=136904
 */
Mobify.ios8_0ScrollFix = function(doc, callback) {
    // Using `getElementsByTagName` here because grabbing head using
    // `document.head` will throw exceptions in some older browsers (iOS 4.3).
    var head = doc.getElementsByTagName('head');
    // Be extra safe and guard against `head` not existing.
    if (!head.length) {
        return;
    }
    var head = head[0];

    var meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    meta.setAttribute('content', 'width=device-width');
    head.appendChild(meta);

    if (callback) {
        // Wait two paints for the meta tag to take effect.
        window.requestAnimationFrame(function() {
            window.requestAnimationFrame(callback);
        });
    }
};

})(Mobify.$, Mobify);
