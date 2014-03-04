/** 
    supportedBrowser will return whether or not we are on a device
    
    @private
    @param {string} ua User agent to test
    @type {bool}
*/
var supportedBrowser = function(ua) {
    // We're enabled for:
    // - WebKit based browsers
    // - IE 10+
    // - FireFox 4+
    // - Opera 11+
    var match = /webkit|(firefox)[\/\s](\d+)|(opera)[\s\S]*version[\/\s](\d+)|(trident)[\/\s](\d+)/i.exec(ua);
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
};
window['supportedBrowser'] = supportedBrowser;