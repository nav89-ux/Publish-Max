FROM node:22-alpine

RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY worker/index.mjs ./worker/index.mjs
CMD ["node", "worker/index.mjs"]
