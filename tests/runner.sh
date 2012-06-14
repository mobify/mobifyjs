#!/bin/bash
serve --port 1337 . &
PID=$!
phantomjs tests/phantom.js
kill $PID