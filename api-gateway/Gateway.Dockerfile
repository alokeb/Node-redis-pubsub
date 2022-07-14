FROM node:alpine

# Bundle app source
COPY . /app
WORKDIR /app
# Install app dependencies
COPY package*.json /app
RUN npm install

# Set the application port to 3000
ENV GATEWAY_PORT = "3000"

# Non-root user
#TODO: Bitnami node helm chart runs as user 1001 - RUN groupmod -g 1001 node && usermod -u 1001 -g 1001 node
USER node
# Start the application
CMD ["npm", "start"]