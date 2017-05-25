#!/bin/bash

docker build -t artifactory.ecovate.com/readytalk/squat:${env.BUILD_NUMBER} .

