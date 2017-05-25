#!/bin/bash

docker build -t artifactory.ecovate.com/readytalk/squattybot:${env.BUILD_NUMBER} .

