install:
    npm install

test:
    serve . && phantomjs tests/phantom.js

jenkins:
    serve . && phantomjs tests/phantom.js | grep '<*>' | tee report.xml

all:
    install