(function($, Mobify) {

// Initialize the Mobify.util namespace
Mobify.util || (Mobify.util = {});

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
            var value = data[list[i]][key];
            if (value) return value;
       }
    }
    return i18nlookup;
};

// Pure Javascript URL absolutification courtesy of https://gist.github.com/1254025

var parseURIMatcher = /^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/;

/**
 * Parses the URI
 *
 * @param url
 * @returns object
 */
function parseURI(url) {
    var m = parseURIMatcher.exec(url);
    // authority = '//' + user + ':' + pass '@' + hostname + ':' port
    return (m ? {
        href     : m[0] || '',
        protocol : m[1] || '',
        authority: m[2] || '',
        host     : m[3] || '',
        hostname : m[4] || '',
        port     : m[5] || '',
        pathname : m[6] || '',
        search   : m[7] || '',
        hash     : m[8] || ''
    } : null);
}

/**
 * Absolutizes the path in `href` based on `base` url.
 *
 * @param base Base URI
 * @param href Path which to convert absolute
 *
 * @returns Absolute URI
 **/
function absolutizeURI(base, href) {// RFC 3986
    function removeDotSegments(input) {
        var output = [];
            input.replace(/^(\.\.?(\/|$))+/, '')
            .replace(/\/(\.(\/|$))+/g, '/')
            .replace(/\/\.\.$/, '/../')
            .replace(/\/?[^\/]*/g, function (p) {
                if (p === '/..') {
                    output.pop();
                } else {
                    output.push(p);
                }
            });
        return output.join('');
    }

    href = parseURI(String(href || '').replace(/^\s+|\s+$/g, ''));
    base = parseURI(String(base || '').replace(/^\s+|\s+$/g, ''));
    if (href === null || base === null) {
        return null;
    }
    var res = {};
    if (href.protocol || href.authority) {
        res.authority = href.authority;
        res.pathname  = removeDotSegments(href.pathname);
        res.search    = href.search;
    } else {
        if (!href.pathname) {
            res.pathname = base.pathname;
            res.search   = href.search || base.search;
        } else {
            if (href.pathname.charAt(0) === '/') {
                res.pathname = removeDotSegments(href.pathname);
            } else {
                if (base.authority && !base.pathname) {
                    res.pathname = removeDotSegments('/' + href.pathname);
                } else {
                    res.pathname = removeDotSegments(base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) + href.pathname);
                }
            }
            res.search = href.search;
        }
        res.authority = base.authority;
    }
    res.protocol = href.protocol || base.protocol;
    res.hash     = href.hash;
    return res.protocol + res.authority + res.pathname + res.search + res.hash;
}

Mobify.util.absolutizeURI = absolutizeURI;

})(Mobify.$, Mobify);
