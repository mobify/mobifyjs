(function() {
    // V6 tags don't set cookies/storage themselves, so we set them here.
    // https://github.com/mobify/portal_app/issues/186
    //
    // mobify-path=<mobifyjs-path>
    // mobify-all

    var hash = location.hash;
    var match = /mobify-path=([^&;]+)/g.exec(hash);
    if (match) {
        var path = match[1];
        if (/mobify-all/.test(hash)) {
            document.cookie = 'mobify-path=' + path + '; path=/';
        } else {
            document.cookie = 'mobify-path=1; path=/';
            sessionStorage["mobify-path"] = path;
        }
    }
})();