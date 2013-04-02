define(["utils", "capture"], function(Utils, Capture) {

var Unblockify = {}

// Moves all scripts to the end of body by overriding insertMobifyScripts
Unblockify.unblock = function() {

    // Grab reference to old insertMobifyScripts method
    var oldInsert = Capture.prototype.insertMobifyScripts;

    // Override insertMobifyScripts to also move the scripts
    // to the end of the body
    Capture.prototype.insertMobifyScripts = function() {
        oldInsert.call(this);

        var doc = this.capturedDoc;
        var scripts = scripts || Utils.removeBySelector("script", doc);
        for (var i=0,ii=scripts.length; i<ii; i++) {
            var script = scripts[i];
            doc.body.appendChild(script);
        }
    };
}

return Unblockify;

});