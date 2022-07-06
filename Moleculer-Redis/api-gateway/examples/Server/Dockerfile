FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/server
WORKDIR /usr/src/server

# Bundle app source
COPY . /usr/src/server

# Install app dependencies
COPY package*.json /usr/src/server

RUN npm install

COPY . .

CMD ["node", "server.js"]