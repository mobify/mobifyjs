window.mobifyjsFileName = "/tests/fixtures/tag/mobify.js";

window.postloadCallback = function() {
    console.log("Whaa?");
    window.postloadFired = true;
}

parent.postMessage("loaded", "*");

console.log("Mobify.js Loaded");