define(["./utils.js", "./capture.js"], function(Utils, Capture) {

var Unblockify = {}

// Moves all scripts to the end of body by overriding insertMobifyScripts
Unblockify.moveScripts = function(scripts, doc) {
    // Remove elements from the document
    Utils.removeElements(scripts, doc);

    for (var i=0,ii=scripts.length; i<ii; i++) {
        var script = scripts[i];
        doc.body.appendChild(script);
    }
};


Unblockify.unblock = function(scripts) {
    // Grab reference to old insertMobifyScripts method
    var oldInsert = Capture.prototype.insertMobifyScripts;

    // Override insertMobifyScripts to also move the scripts
    // to the end of the body
    Capture.prototype.insertMobifyScripts = function() {
        oldInsert.call(this);

        var doc = this.capturedDoc;
        Unblockify.moveScripts(scripts, doc);
    };
};

return Unblockify;

});
