# Base image
FROM node:22-slim AS base

# Set working directory
WORKDIR /home/node/app

# Install OS dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy necessary files
COPY package.json yarn.lock ./
COPY .yarn/ .yarn/
COPY .yarnrc.yml ./

# Enable corepack & install deps
RUN corepack enable
RUN yarn install --immutable

# Copy the rest of the app
COPY . .

# Build everything
RUN yarn build

# Final image
FROM node:22-slim

WORKDIR /home/node/app

COPY --from=base /home/node/app /home/node/app

ENV NODE_ENV=production
ENV PAYLOAD_CONFIG_PATH=dist/payload/payload.config.js

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]
