#!/bin/bash
set -o pipefail

node tests/server.js &
PID=$!

sleep 1
phantomjs tests/phantom.js | grep '<*>' | tee report.xml
ret_code=$?

kill $PID
exit $ret_code
