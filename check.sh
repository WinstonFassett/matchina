#!/usr/bin/env bash
npm i || exit 125
npm run build:all
result=$?
git checkout -- .
exit $result