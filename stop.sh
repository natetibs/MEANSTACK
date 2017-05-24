#!/bin/bash
docker-compose stop
docker rm $(docker ps -a -q -f status=exited)