# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
RUN npm run build

FROM nginx:1.27-alpine AS runtime
ARG VITE_BASE_PATH=/
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY docker/configure-nginx-base-path.sh /usr/local/bin/configure-nginx-base-path.sh
COPY --from=builder /app/dist /tmp/dist
RUN chmod +x /usr/local/bin/configure-nginx-base-path.sh \
	&& /usr/local/bin/configure-nginx-base-path.sh "${VITE_BASE_PATH}" /tmp/dist \
	&& rm -rf /tmp/dist

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
