# ── AutoPost Hub Frontend ──
FROM node:20-alpine

WORKDIR /app

# Accept API URL at build time (Next.js bakes NEXT_PUBLIC_ vars at build)
ARG NEXT_PUBLIC_API_URL=https://api.up.modula.click
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Run
CMD ["npm", "start"]
