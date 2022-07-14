FROM node:bullseye-slim

# Bundle app source
COPY . /app
WORKDIR /app
# Install app dependencies
COPY package*.json /app
RUN npm install

# Set the application port to 3000
ENV PORT="3000"

# Non-root user
USER node
# Start the application
CMD ["npm", "start"]