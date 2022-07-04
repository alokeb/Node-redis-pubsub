FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/store-example
WORKDIR /usr/src/store-example

# Bundle app source
COPY . /usr/src/store-example

# Install app dependencies
COPY package*.json /usr/src/store-example

RUN npm install
#RUN npm i express socket.io kafka-node
# If you are building your code for production
# RUN npm ci --only=production


CMD [ "node", "index.js" ]

EXPOSE 3000