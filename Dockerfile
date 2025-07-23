# Stage 1: Build the frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY postcss.config.js tailwind.config.ts vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY index.html ./
COPY public ./public
COPY src ./src
RUN npm install -g pnpm && pnpm install --frozen-lockfile && pnpm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY public/favicon.ico /usr/share/nginx/html/favicon.ico
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
