FROM node:bullseye-slim

RUN mkdir -p /app
WORKDIR /app

# Bundle app source
COPY . /app

# Set the application port to 3000
ENV PORT="3000"

# Install app dependencies
COPY package*.json /app
RUN npm install

COPY . .

# Start the application
CMD ["npm", "start"]