$.extend(Mobify, {
    $: $.noConflict(true),
    _: _.noConflict()
});
window.debug = window.console;
// detect.js schedules a desktopAnalytics() call for tracking on normal
// untransformed desktop pages. This data can be used to determine what pages
// should be transformed first.
// However, if mobify.js was actually loaded, we are able to perform much
// more detailed analytics information gathering, and ought to cancel that
// desktopAnalytics call. The simplest way to do so is by nooping it.
Mobify.desktopAnalytics = function(){};