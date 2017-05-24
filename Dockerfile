FROM node:onbuild
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev libkrb5-dev
RUN mkdir /MEANSTACK
WORKDIR /MEANSTACK
ADD package.json /MEANSTACK/package.json
RUN npm install
RUN npm install express --save
RUN npm install mongoose --save
RUN npm install mongodb --save
RUN npm install body-parser --save
ADD . /MEANSTACK