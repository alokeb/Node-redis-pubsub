FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/fruit-service
WORKDIR /usr/src/fruit-service

# Bundle app source
COPY . /usr/src/fruit-service

# Install app dependencies
COPY package*.json /usr/src/fruit-service

RUN npm install

COPY . .

CMD ["node", "fruit-service.js"]