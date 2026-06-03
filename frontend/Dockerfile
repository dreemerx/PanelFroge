FROM docker.1ms.run/node:20-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
RUN pnpm config set registry https://registry.npmmirror.com

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM docker.1ms.run/nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 15173
