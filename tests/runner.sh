#!/bin/bash

# Start Test server
node tests/server.js &
PID=$!
sleep 1

# Run test suite and record exit code as pass/fail result
phantomjs tests/phantom.js
EXIT_STATUS=$?

# Tear down the test server
kill $PID

# Exit with status code of test suite
exit $EXIT_STATUS