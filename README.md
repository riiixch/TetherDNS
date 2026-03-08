<div align="center">
<h1>🌐 TetherDNS</h1>
<p><strong>Cloudflare DDNS Manager:</strong> A simple, powerful Dynamic DNS management system for Cloudflare.</p>

</div>

## 📖 Introduction

**TetherDNS** (formerly Cloudflare DDNS Manager) is a web application developed to seamlessly integrate with the Cloudflare API for automated IP address management (Dynamic DNS) through a beautiful, easy-to-use Web UI. It is ideal for users running home servers, CCTV systems, or any services where the Internet Service Provider (ISP) frequently changes the IP address.

## ✨ Features

- 🔒 **Cloudflare Account Management:** Supports adding multiple accounts via API Tokens.
- 🌍 **Zone & DNS Record Management:** View and directly edit DNS records for your domains on Cloudflare.
- 🔄 **Auto IP Update (DDNS):** Generate specific URLs (Update Tokens) to use with Cronjobs, Routers, or Scripts to automatically link new IPs to your domains.
- 📜 **Update Logs:** Keep detailed records of IP address changes.
- 🔔 **Notifications:** Receive alerts for IP changes via Discord, LINE Notify, and Email.
- 👀 **Audit Logs:** Track system activities and user actions.
- 🌐 **Bilingual Support (i18n):** Available in both English and Thai.
- 🎨 **Beautiful UI:** Designed with Nuxt UI, ensuring a seamless user experience on both desktop and mobile devices.

## 🛠️ Tech Stack

- **Frontend:** Nuxt 4, Vue 3, Nuxt UI, TailwindCSS, @nuxtjs/i18n
- **Backend:** Nuxt Nitro
- **Database:** LibSQL (SQLite) + Prisma ORM
- **Deployment:** Docker & Docker Compose

## 🚀 Installation & Setup

### Method 1: Docker Installation (Recommended)

1. Clone the repository to your local machine:

```bash
git clone https://github.com/yourusername/tetherdns.git
cd tetherdns

```

2. Create and configure the `.env` file:

```bash
cp .env.example .env

```

Open the `.env` file and edit `SESSION_PASSWORD` (enter a long, secure, and random password).

3. Run Docker Compose:

```bash
docker-compose up -d

```

TetherDNS will be available at `http://localhost:3000`.

---

### Method 2: Manual Installation (Node.js)

**Prerequisites:**

- Node.js (version 18 or higher) or Bun

1. Clone the repository:

```bash
git clone https://github.com/yourusername/tetherdns.git
cd tetherdns

```

2. Install dependencies:

```bash
npm install
# or bun install

```

3. Copy and configure the `.env` file:

```bash
cp .env.example .env

```

4. Set up the database (Prisma):

```bash
npm run prisma:push
npm run prisma:gen

```

5. Run the development server:

```bash
npm run dev

```

The application will be running at `http://localhost:3000`.

For production deployment:

```bash
npm run build
npm start

```

## ⚙️ Environment Variables

The `.env` file requires the following configurations:

| Variable           | Description                                                                          |
| ------------------ | ------------------------------------------------------------------------------------ |
| `DATABASE_URL`     | Database file path, e.g., `file:./tetherdns.db` or any preferred path.               |
| `SESSION_PASSWORD` | Password for Session encryption (must be a random string of at least 32 characters). |

## 📜 License

This project is licensed under the [MIT License](https://www.google.com/search?q=LICENSE) (add a https://www.google.com/search?q=LICENSE file if available).
