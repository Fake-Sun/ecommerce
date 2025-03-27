# Base image
FROM node:22-slim

# Set working directory
WORKDIR /home/node/app

# Install OS dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package info
COPY package.json yarn.lock ./
COPY .yarn/ .yarn/
COPY .yarnrc.yml ./

# Install corepack + dependencies
RUN corepack enable
RUN yarn install --immutable

# Copy all files
COPY . .

# Set development environment
ENV NODE_ENV=development

# Expose port
EXPOSE 3000

CMD ["yarn", "dev"]