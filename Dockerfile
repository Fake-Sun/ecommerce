FROM node:18-slim

# Set working directory
WORKDIR /app

# Install OS deps for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy everything
COPY . .

# Install deps (avoid optional)
RUN yarn install --frozen-lockfile --ignore-optional

# Build app
RUN yarn build

# Set environment
ENV NODE_ENV=production
ENV PAYLOAD_CONFIG_PATH=dist/payload.config.js

EXPOSE 3000

# Start server
CMD ["node", "dist/server.js"]
