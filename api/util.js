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
 * This patches HTML to hide the body until the first paint (and hopefully after
 * the initial viewport is calculated). By the time we show the body the new
 * viewport should have already taken effect.
 *
 * JIRA: https://mobify.atlassian.net/browse/GOLD-883
 * Open Radar: http://www.openradar.me/radar?id=5516452639539200
 * WebKit Bugzilla: https://bugs.webkit.org/show_bug.cgi?id=136904
 */
Mobify.ios8_0ScrollFix = function(htmlString) {
    var BODY_REGEX = /<body(?:[^>'"]*|'[^']*?'|"[^"]*?")*>/i;

    var openingBodyTag = BODY_REGEX.exec(htmlString);
    // Do nothing if we can't find an opening `body` tag.
    if (!openingBodyTag) {
        return htmlString;
    }
    openingBodyTag = openingBodyTag[0];

    // Use DOM methods to manipulate the attributes on the `body` tag. This
    // lets us rely on the browser to set body's style to `display: none`.
    // We create a containing element to be able to set an inner HTML string.
    var divEl = document.createElement('div');
    
    // The `div`'s inner string can't be a `body` tag, so we temporarily change
    // it to a `div`..
    var openingBodyTagAsDiv = openingBodyTag.replace(/^<body/, '<div');
    divEl.innerHTML = openingBodyTagAsDiv;

    // ..so that we can set it to be hidden..
    divEl.firstChild.style.display = 'none';

    // ..and change it back to a `body` string!
    openingBodyTagAsDiv = divEl.innerHTML.replace(/<\/div>$/, '');
    openingBodyTag = openingBodyTagAsDiv.replace(/^<div/, '<body');

    // Append the script to show the body after two paints. This needs to be
    // inside the body to ensure that `document.body` is available when it
    // executes.
    var script =
        "<script>" +
        "  window.requestAnimationFrame(function() {" +
        "    window.requestAnimationFrame(function() {" +
        "      document.body.style.display = '';" +
        "    });" +
        "  });" +
        "<\/script>";

    return htmlString.replace(BODY_REGEX, openingBodyTag + script);
};

})(Mobify.$, Mobify);
