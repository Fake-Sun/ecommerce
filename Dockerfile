# Base image
FROM node:22-slim

# Set working directory
WORKDIR /home/node/app

# Install OS dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy necessary files
COPY package.json yarn.lock ./
COPY .yarn/ .yarn/
COPY .yarnrc.yml ./
COPY . .

# Enable corepack & install deps
RUN corepack enable
RUN yarn install --immutable

# Optional: generate Payload types and schema
RUN yarn generate:graphQLSchema || true
RUN yarn generate:types || true

# ⚠️ MISSING BUILD STEP — this compiles Payload + server + Next.js
RUN yarn build
RUN yarn copyfiles


# Expose the app port
EXPOSE 3000

# Run in production mode
CMD ["env", "PAYLOAD_CONFIG_PATH=dist/payload/payload.config.js", "node", "--max-old-space-size=1024", "dist/server.js"]
