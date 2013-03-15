require.config({
    "wrap": true,
    "baseUrl": ".",
    "keepBuildDir": true,
    "paths": {   
        "Zepto": "vendor/zepto"
    },
    "shim": {
        "Zepto": {"exports": "$"}
    }
});
