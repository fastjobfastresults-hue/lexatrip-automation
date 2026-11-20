# Lexa Trip Social Automation Cloud Engine
FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install production dependencies (ffmpeg-static, sharp, express, etc.)
RUN npm install --omit=dev

# Copy project files
COPY . .

# Environment settings
ENV NODE_ENV=production
ENV PORT=10000
ENV NODE_OPTIONS="--max-old-space-size=256"

# Expose port for Render
EXPOSE 10000

# Start Automation Server with strict memory limit
CMD ["node", "--max-old-space-size=256", "server.js"]
