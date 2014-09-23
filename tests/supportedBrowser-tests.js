module("SupportedBrowser");

test("Ensure Supported Browser function works", function() {
    var ua = "Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko";
    equal(window.supportedBrowser(ua), true, "Correctly detects browser support for IE11");

    var ua = "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)";
    equal(window.supportedBrowser(ua), true, "Correctly detects browser support for IE10");

    var ua = "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 7.1; Trident/5.0)";
    equal(window.supportedBrowser(ua), false, "Correctly detects browser support for IE9");

    var ua = "Mozilla/45.0 (compatible; MSIE 6.0; Windows NT 5.1)";
    equal(window.supportedBrowser(ua), false, "Correctly detects browser support for IE6");

    // Firefox browsers
    var ua = "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.2.9) Gecko/20100915 Gentoo Firefox/3.6.9";
    equal(window.supportedBrowser(ua), false, "Correctly detects browser support for FF3.6");

    var ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:25.0) Gecko/20100101 Firefox/25.0";
    equal(window.supportedBrowser(ua), true, "Correctly detects browser support for FF25");

    var ua = "Mozilla/5.0 (X11; U; Linux i686; ru; rv:1.9.1.3) Gecko/20091020 Ubuntu/10.04 (lucid) Firefox/4.0.1";
    equal(window.supportedBrowser(ua), true, "Correctly detects browser support for Firefox 4.0.1");

    var ua = "Mozilla/6.0 (Windows NT 6.2; WOW64; rv:16.0.1) Gecko/20121011 Firefox/16.0.1";
    equal(window.supportedBrowser(ua), true, "Correctly detects browser support for Firefox 16.0.1");

    // iOS browsers
    var ua = "Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_0 like Mac OS X; en-us) AppleWebKit/532.9 (KHTML, like Gecko) Version/4.0.5 Mobile/8A293 Safari/6531.22.7";
    equal(window.supportedBrowser(ua), true, "Correctly detects browser support for iPhone");

    // Chrome browsers
    var ua = "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.15 (KHTML, like Gecko) Chrome/24.0.1295.0 Safari/537.15";
    equal(window.supportedBrowser(ua), true, "Correctly detects browser support for Chrome 24");

    // Opera browsers
    var ua = "Opera/12.80 (Windows NT 5.1; U; en) Presto/2.10.289 Version/12.02";
    equal(window.supportedBrowser(ua), true, "Correctly detects browser support for Opera 12");

    var ua = "Opera/9.80 (X11; Linux x86_64; U; Ubuntu/10.10 (maverick); pl) Presto/2.7.62 Version/11.01";
    equal(window.supportedBrowser(ua), true, "Correctly detects browser support for Opera 11");

    var ua = "Opera/9.80 (Windows NT 6.1; U; pl) Presto/2.6.31 Version/10.70";
    equal(window.supportedBrowser(ua), false, "Correctly detects browser support for Opera 10");
});