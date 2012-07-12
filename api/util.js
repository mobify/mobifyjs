/**
 * Utility functions.
 */
(function(Mobify) {

/**
 * Set the opt-out cookie and reload the page.
 */
Mobify.desktop = function(url) {
    document.cookie = 'mobify-path=; path=/;';

    if (url) {
        location = url;
    } else {
        location.reload();
    }
};

/**
 * Converts in a list of language types and data and returns a function that 
 * allows you to grab translation keys from that data
 */
Mobify.i18n = function(list, data) {
    list.push("DEFAULT");

    return function(key) {
        for (var i = 0; i < list.length; i++) {
            var value = data[list[i]][key];
            if (value) return value;
       }
    };
};

})(Mobify);
