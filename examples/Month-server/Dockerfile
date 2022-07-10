FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/month-service
WORKDIR /usr/src/month-service

# Bundle app source
COPY . /usr/src/month-service

# Install app dependencies
COPY package*.json /usr/src/month-service

RUN npm install

COPY . .

CMD ["node", "month-service.js"]