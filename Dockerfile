FROM node:20-alpine
LABEL org.opencontainers.image.source https://github.com/rubenvitt/life-automations

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3003

CMD ["node", "dist/main"]