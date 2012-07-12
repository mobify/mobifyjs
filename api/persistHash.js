/**
 * Persist config passed via the hash using cookies and sessionStorage.
 *
 * If `mobify-path` exists, it contains the path of the Mobify.js file that 
 * should be loaded in this tab (most likely the path to this file). If 
 * `mobify-all` also exists, store options to load this file in all tabs.
 */
(function(document) {

var hash = location.hash
  , match = /mobify-path=([^&;]+)/g.exec(hash)
  , path;

if (!match) return;

path = match[1];

if (/mobify-all/.test(hash)) {
    document.cookie = 'mobify-path=' + path + '; path=/';
} else {
    document.cookie = 'mobify-path=1; path=/';
    sessionStorage['mobify-path'] = path;
}

})(document);