FROM bitnami/node:18

# Copy the application code
COPY . /app

# Set working directory
WORKDIR /app

# Create a non-root user
RUN useradd -r -u 1001 -g root nonroot
RUN chown -R nonroot /app
USER nonroot

# Set the application port to 3000
ENV PORT="3000"

# Start the application
CMD ["npm", "start"]