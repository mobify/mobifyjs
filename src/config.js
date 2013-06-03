require.config({
    "wrap": true,
    "baseUrl": ".",
    "keepBuildDir": true,
    "paths": {   
        "mobifyjs": ".",
        "Zepto": "vendor/zepto"
    },
    "shim": {
        "Zepto": {"exports": "$"}
    }
});
