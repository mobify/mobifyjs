define(function() {
    window.Mobify = window.Mobify || {};

    Mobify.api = [1, 2, 3];
    Mobify.points && Mobify.points.push(new Date);

    // Set optout cookie and reload to goto desktop.
    // V6.X: mobify-path=
    //
    // `url`: Optional url to redirect to after opting out.
    Mobify.desktop = function(url) {
        document.cookie = 'mobify-path; path=/;';

        if (url) {
            location = url;
        } else {
            location.reload();
        }
    };

    return window.Mobify;
});