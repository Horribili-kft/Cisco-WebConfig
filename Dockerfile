# Build command (for AMD64 and Arm64 architecture building):
# sudo docker buildx build --platform linux/amd64,linux/arm64 -t krissssz/cisco-webconfig --push .
# This requires that your docker is configured with buildx. https://docs.docker.com/build/concepts/overview/#buildx

# To just build it locally:
# docker build -t my-local-image .

# -------------------------- Stage 1: Build stage --------------------------
FROM node:23-alpine AS build

# Install Python and pip (required for building)
RUN apk add --no-cache python3 py3-pip binutils

WORKDIR /app

# Copy package.json and install dependencies (including dev dependencies)
COPY package*.json ./
RUN npm install --include=dev --legacy-peer-deps

# Copy all the application files
COPY . .

# Install Python dependencies (including dev dependencies)
RUN if [ -f "requirements.txt" ]; then pip3 install --no-cache-dir --break-system-packages -r requirements.txt; fi
RUN if [ -f "requirements-dev.txt" ]; then pip3 install --no-cache-dir --break-system-packages -r requirements-dev.txt; fi

# Build the app
RUN npm run build-all

# Copy static assets and public folder into the standalone folder (https://nextjs.org/docs/app/api-reference/next-config-js/output)
RUN cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/

# We now have a built app the same as if we were to build it on the host machine.
# We now copy the built app to the image that will actually run it
# This is so we keep the runner small (right now it is ~300 MB, which is quite big for what the app can do, but it is fine in my eyes considering it's compatible with everything that runs docker)

# -------------------------- Stage 2: Production stage --------------------------
FROM node:23-alpine AS runtime

# Install only necessary runtime dependencies (Python in this case)
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy only the .next/standalone directory from the build stage
COPY --from=build /app/.next/standalone /app/.next/standalone

# Install only the production Python dependencies (if required)
RUN if [ -f "requirements.txt" ]; then pip3 install --no-cache-dir --break-system-packages -r requirements.txt; fi

# Expose the application port
EXPOSE 3000
EXPOSE 22
EXPOSE 23

# Start the app with the generated server.js
CMD ["node", ".next/standalone/server.js"]
