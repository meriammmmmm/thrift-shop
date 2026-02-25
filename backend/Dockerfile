FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install
RUN npm ci --only=production

# Copy app files
COPY . .

# Expose port
EXPOSE 5001

# Start app
CMD ["npm", "start"]
