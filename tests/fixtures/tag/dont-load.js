window.mobifyJSLoaded = true;
window.mobifyjsFileName = "/tests/fixtures/tag/dont-load.js";

Assert.ok(false, "dont-load.js was loaded.");
Assert.ready();