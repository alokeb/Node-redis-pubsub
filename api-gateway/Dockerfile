FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/moleculer
WORKDIR /usr/src/moleculer

# Bundle app source
COPY . /usr/src/moleculer

# Install app dependencies
COPY package*.json /usr/src/moleculer

RUN npm install
#RUN npm i express socket.io kafka-node
# If you are building your code for production
# RUN npm ci --only=production


CMD [ "node", "start.js" ]