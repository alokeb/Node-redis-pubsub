FROM node:bullseye-slim

# Bundle app source
RUN mkdir -p /app
COPY . /app
WORKDIR /app
# Install app dependencies
COPY package*.json /app
RUN npm install

# Set the application port to 3000
ENV PORT="3000"

# Start the application
CMD ["npm", "start"]