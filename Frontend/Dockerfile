FROM oven/bun:latest

WORKDIR /app

# 依存だけ先にコピー
COPY package.json bun.lockb* ./

RUN bun install

# ソースコピー
COPY . .

EXPOSE 3000

CMD ["bun", "run", "dev"]