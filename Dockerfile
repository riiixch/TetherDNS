# ==========================================
# Stage 1: Builder
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ==========================================
# Stage 2: Runner (ตัวที่ใช้งานจริง)
# ==========================================
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl libc6-compat wget ca-certificates && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then CF_ARCH="amd64"; \
    elif [ "$ARCH" = "aarch64" ]; then CF_ARCH="arm64"; \
    else CF_ARCH="amd64"; fi && \
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH} -O /usr/local/bin/cloudflared && \
    chmod +x /usr/local/bin/cloudflared

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# ★ แก้ไขตรงนี้: สั่ง install prisma เพื่อให้ npx สร้างไฟล์ .bin ให้สมบูรณ์ 
# และใช้ npm cache clean --force ต่อท้ายทันทีเพื่อลบขยะทิ้ง (ไม่กินพื้นที่เพิ่ม)
RUN npm install prisma @libsql/client @libsql/linux-x64-musl --no-save && \
    npm cache clean --force

EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["sh", "-c", "npx prisma db push && node .output/server/index.mjs"]