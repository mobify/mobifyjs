#!/bin/bash
node tests/server.js &
PID=$!
phantomjs tests/runner.js | grep '<*>' | tee report.xml
kill $PID