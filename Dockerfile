FROM artifactory.ecovate.com/readytalk/squattybot:1
#RUN mkdir -p /var/src/squattybot
#WORKDIR /var/src/squattybot
WORKDIR /var/src/squattybot
RUN npm install
RUN npm install express --save
RUN npm install mongoose --save
RUN npm install mongodb --save
RUN npm install body-parser --save
COPY package.json /var/src/squattybot
RUN npm install
COPY . /var/src/squattybot
RUN node test.js