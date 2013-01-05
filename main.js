require(["http://localhost:3000/config.js"], function() {
    require.config({
        baseUrl: "http://localhost:3000",
        waitSeconds: 15,
    });
    require(["http://localhost:3000/mobify.js"]);
});