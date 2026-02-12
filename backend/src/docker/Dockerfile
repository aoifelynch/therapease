# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
