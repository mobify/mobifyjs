#!/bin/bash
serve --port 1337 . &
PID=$!
sleep 1
phantomjs tests/phantom.js
kill $PID