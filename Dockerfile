FROM node:18-slim as base

# Builder
FROM base as builder

WORKDIR /home/node/app

# OS deps for native modules like sharp, bcrypt
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies
RUN yarn install --immutable

COPY . .

RUN yarn build

# Runtime
FROM base as runtime

WORKDIR /home/node/app

ENV NODE_ENV=production
ENV PAYLOAD_CONFIG_PATH=dist/payload.config.js

COPY package.json yarn.lock .yarnrc.yml ./

RUN yarn install --immutable

COPY --from=builder /home/node/app/dist ./dist
COPY --from=builder /home/node/app/build ./build

EXPOSE 3000

CMD ["node", "dist/server.js"]
