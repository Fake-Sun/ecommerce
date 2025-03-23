# Base image with full Node + Debian (more memory-safe than Alpine)
FROM node:18-slim as base

# Builder stage
FROM base as builder

WORKDIR /home/node/app

# Install OS deps for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy only what we need for install
COPY package.json yarn.lock ./

# Install dependencies (skip optional, cache-safe)
RUN yarn install --frozen-lockfile --ignore-optional

# Copy the rest of the app
COPY . .

# Build app
RUN yarn build

# Runtime image (slim and production-ready)
FROM base as runtime

ENV NODE_ENV=production
ENV PAYLOAD_CONFIG_PATH=dist/payload.config.js

WORKDIR /home/node/app

COPY package.json yarn.lock ./

# Only install production deps
RUN yarn install --production --ignore-optional

# Copy build output from builder
COPY --from=builder /home/node/app/dist ./dist
COPY --from=builder /home/node/app/build ./build

EXPOSE 3000

CMD ["node", "dist/server.js"]
