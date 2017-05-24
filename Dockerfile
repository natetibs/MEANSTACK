FROM node:onbuild
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev libkrb5-dev
RUN mkdir /squat
WORKDIR /squat
ADD package.json /squat/package.json
RUN npm install
ADD . /squat