FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/moleculer
WORKDIR /usr/src/moleculer

# Bundle app source
COPY . /usr/src/moleculer

# Install app dependencies
COPY package*.json /usr/src/moleculer

RUN npm install

COPY . .

CMD ["node", "index.js"]