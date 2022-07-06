FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/client
WORKDIR /usr/src/client

# Bundle app source
COPY . /usr/src/client

# Install app dependencies
COPY package*.json /usr/src/client

RUN npm install

COPY . .

CMD ["node", "client.mjs"]