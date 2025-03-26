# ---------------------------
# Base Image
# ---------------------------
  FROM node:22-slim AS base

  # ---------------------------
  # Builder Image
  # ---------------------------
  FROM base AS builder
  
  WORKDIR /home/node/app
  
  # OS deps
  RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
  
  # Copy files needed to install and build
  COPY package.json yarn.lock ./
  COPY .yarn/ .yarn/
  COPY .yarnrc.yml ./
  COPY . .

  RUN corepack enable
  RUN yarn install --immutable

  # After installing dependencies
  RUN yarn generate:graphQLSchema
  RUN yarn generate:types

  # Prevent Payload from running during build
  ENV PAYLOAD_BUILD=true

  # Then build
  RUN yarn build --frozen-lockfile && yarn tsc
  # ---------------------------
  # Runtime Image
  # ---------------------------
  FROM base AS runtime
  
  WORKDIR /home/node/app
  
  ENV NODE_ENV=production
  ENV PAYLOAD_CONFIG_PATH=dist/payload/payload.config.js
  
  # Install runtime dependencies
  COPY package.json yarn.lock ./
  COPY .yarn/ .yarn/
  COPY .yarnrc.yml ./
  RUN corepack enable
  RUN yarn install --immutable
  
  # Optional (if ts-node needed)
  RUN yarn add ts-node typescript @types/node
  
  # Copy built files from builder
  COPY --from=builder /home/node/app/dist ./dist
  COPY --from=builder /home/node/app/build ./build
  COPY --from=builder /home/node/app/src ./src
  COPY --from=builder /home/node/app/public ./public
  
  EXPOSE 3000
  
  CMD ["node", "dist/server.js"]
  