#!/bin/bash
node tests/server.js &
PID=$!

sleep 1
phantomjs tests/phantom.js
ret_code=$?

kill $PID
exit $ret_code
