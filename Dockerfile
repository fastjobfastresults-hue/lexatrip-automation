# Ultra HD Social Media Automation Engine
# Base: Debian Bullseye slim with Node.js 20
FROM node:20-bullseye-slim

# Install system dependencies: FFmpeg, fonts, ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-dejavu-core \
    fonts-freefont-ttf \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy project files
COPY . .

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3800
ENV FFMPEG_PATH=/usr/bin/ffmpeg

# Expose default application port
EXPOSE 3800

# Start server
CMD ["node", "server.js"]
