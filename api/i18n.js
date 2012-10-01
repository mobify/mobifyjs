define(["./mobifyjs"], function(Mobify) {

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

return Mobify;

});
