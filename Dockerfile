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

# Install nodemon globally (dev-only)
RUN yarn global add nodemon ts-node

# Set development environment
ENV NODE_ENV=development

# Expose port
EXPOSE 3000

# Start dev server with nodemon
CMD ["nodemon"]
