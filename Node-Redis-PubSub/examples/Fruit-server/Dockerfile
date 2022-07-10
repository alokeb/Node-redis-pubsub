FROM node:alpine

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Bundle app source
COPY . /app

# Set the application port to 3000
ENV PORT="3000"

COPY . .

CMD ["npm", "start"]