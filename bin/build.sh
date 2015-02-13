#!/bin/bash

rm -rf build/
mkdir build/
cd build
git init
git pull ../
r.js -o public/javascripts/build.js 
rm public/javascripts/app.js
mv public/javascripts/app-built.js public/javascripts/app.js
git add public/javascripts/app.js
git commit -m "Build"
cd ..

