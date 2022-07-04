FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/api-producers
WORKDIR /usr/src/api-producers

# Bundle app source
COPY . /usr/src/api-producers

# Install app dependencies
COPY package*.json /usr/src/api-producers

RUN npm install
#RUN npm i express socket.io kafka-node
# If you are building your code for production
# RUN npm ci --only=production


CMD [ "node", "start.js" ]

EXPOSE 3070