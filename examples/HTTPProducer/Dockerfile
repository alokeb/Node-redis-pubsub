FROM node:bullseye-slim

RUN apt-get update && \
    apt-get install -y iputils-ping curl

# Bundle app source
COPY . /app
WORKDIR /app

# Install app dependencies
COPY package*.json /app
RUN npm install

# Run as non-root user - Bitnami helm chart requires user 1001
RUN groupmod -g 1001 node && usermod -u 1001 -g 1001 node
RUN chown -R node:node /app
USER node

# Start the application
CMD ["npm", "start"]