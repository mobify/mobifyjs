#!/bin/bash
node tests/server.js &
PID=$!
sleep 1
phantomjs tests/phantom.js | grep '<*>' | tee report.xml
kill $PID