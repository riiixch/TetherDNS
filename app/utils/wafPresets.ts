import type { WafPreset } from '~~/types/security'

export const WAF_PRESETS: WafPreset[] = [
    {
        id: 'protect-sensitive-files',
        title: 'Protect Sensitive Config & Git Files',
        titleTh: 'ป้องกันไฟล์คอนฟิกและความลับ (.env, .git, config)',
        description: 'Block requests attempting to access sensitive environment files, version control repositories, and configurations.',
        descriptionTh: 'บล็อกคำขอที่พยายามเข้าถึงไฟล์ .env, .git, composer.json, web.config, wp-config.php และไฟล์ระบบที่อาจรั่วไหล',
        category: 'threat',
        icon: 'i-heroicons-shield-exclamation',
        action: 'block',
        expression: '(http.request.uri.path contains "/.env" or http.request.uri.path contains "/.git" or http.request.uri.path contains "/wp-config.php" or http.request.uri.path contains "/composer.json" or http.request.uri.path contains "/web.config" or http.request.uri.path contains "/id_rsa")',
        recommended: true,
        badge: 'RECOMMENDED'
    },
    {
        id: 'block-aggressive-scrapers',
        title: 'Block Aggressive Scrapers & Bad Crawlers',
        titleTh: 'บล็อกสแครปเปอร์รบกวนและบอทสูบข้อมูล (Scrapers & Crawlers)',
        description: 'Prevent heavy automated scrapers (SemrushBot, AhrefsBot, MJ12bot, DotBot, Bytespider) from consuming excessive server resources.',
        descriptionTh: 'บล็อกบอทดูดคอนเทนต์และสแครปเปอร์ที่สร้างโหลดสูง เช่น SemrushBot, AhrefsBot, MJ12bot, DotBot, Bytespider เพื่อประหยัด Bandwidth',
        category: 'bot',
        icon: 'i-heroicons-bug-ant',
        action: 'block',
        expression: '(http.user_agent contains "SemrushBot" or http.user_agent contains "AhrefsBot" or http.user_agent contains "MJ12bot" or http.user_agent contains "DotBot" or http.user_agent contains "Bytespider")',
        recommended: true,
        badge: 'POPULAR'
    },
    {
        id: 'wordpress-admin-shield',
        title: 'WordPress & Admin Panel Shield',
        titleTh: 'ป้องกันหน้าแอดมิน WordPress & Login (Managed Challenge)',
        description: 'Require interactive Managed Challenge verification before accessing WordPress admin paths (/wp-admin, /wp-login.php, xmlrpc.php).',
        descriptionTh: 'บังคับผ่านการตรวจสอบ Cloudflare Managed Challenge เมื่อเข้าสู่หน้า /wp-admin, /wp-login.php หรือ xmlrpc.php เพื่อป้องกัน Brute Force',
        category: 'cms',
        icon: 'i-heroicons-lock-closed',
        action: 'managed_challenge',
        expression: '(http.request.uri.path contains "/wp-admin" or http.request.uri.path contains "/wp-login.php" or http.request.uri.path contains "/xmlrpc.php")',
        recommended: true,
        badge: 'WORDPRESS'
    },
    {
        id: 'block-sqli-xss',
        title: 'Block Common SQL Injection & XSS Patterns',
        titleTh: 'ป้องกันการโจมตี SQL Injection และ XSS ใน URL Query',
        description: 'Detect and block basic SQL injection attempts (UNION SELECT) and script injection in URI query parameters.',
        descriptionTh: 'ตรวจจับและบล็อกคำขอที่มีคีย์เวิร์ด SQL Injection (เช่น UNION SELECT) หรือพยายามฉีด <script> ผ่านทางพารามิเตอร์ URL',
        category: 'threat',
        icon: 'i-heroicons-code-bracket',
        action: 'block',
        expression: '(http.request.uri.query contains "union+select" or http.request.uri.query contains "union%20select" or http.request.uri.query contains "<script" or http.request.uri.query contains "%3Cscript")',
        recommended: true,
        badge: 'EXPLOIT SHIELD'
    },
    {
        id: 'block-ai-crawlers',
        title: 'Block AI Model Training Crawlers',
        titleTh: 'บล็อกบอท AI และ LLM Scrapers (GPTBot, ClaudeBot)',
        description: 'Block well-known AI data collection bots including OpenAI GPTBot, Anthropic ClaudeBot, Common Crawl CCBot, and Perplexity.',
        descriptionTh: 'บล็อกบอทดูดข้อมูลเพื่อเทรนโมเดล AI เช่น GPTBot, ChatGPT-User, ClaudeBot, CCBot, PerplexityBot และ Applebot-Extended',
        category: 'bot',
        icon: 'i-heroicons-sparkles',
        action: 'block',
        expression: '(http.user_agent contains "GPTBot" or http.user_agent contains "ChatGPT-User" or http.user_agent contains "ClaudeBot" or http.user_agent contains "CCBot" or http.user_agent contains "PerplexityBot" or http.user_agent contains "Applebot-Extended")',
        recommended: false,
        badge: 'AI SHIELD'
    },
    {
        id: 'block-db-admin-probes',
        title: 'Block Database Admin & PHP Web Shell Probes',
        titleTh: 'บล็อกการสแกนหา phpMyAdmin, Adminer และ PHP Web Shell',
        description: 'Block automated vulnerability scanners looking for phpMyAdmin, adminer, or commonly uploaded webshell scripts.',
        descriptionTh: 'บล็อกบอทสแกนหาเครื่องมือจัดการฐานข้อมูล phpMyAdmin, Adminer หรือไฟล์ Web Shell ทั่วไป เช่น shell.php, eval-stdin.php',
        category: 'threat',
        icon: 'i-heroicons-server-stack',
        action: 'block',
        expression: '(http.request.uri.path contains "phpmyadmin" or http.request.uri.path contains "/pma/" or http.request.uri.path contains "adminer" or http.request.uri.path contains "shell.php" or http.request.uri.path contains "eval-stdin.php")',
        recommended: false,
        badge: 'PROBE DEFENSE'
    },
    {
        id: 'geo-challenge-non-th',
        title: 'Domestic Shield: Challenge Non-Thailand Traffic',
        titleTh: 'คัดกรองผู้ใช้งานต่างประเทศ (Challenge Non-TH Traffic)',
        description: 'Issue a Cloudflare Managed Challenge for all traffic originating from outside Thailand, reducing overseas automated bot traffic.',
        descriptionTh: 'ส่ง Managed Challenge ท้าทายผู้เข้าชมทั้งหมดที่มาจากนอกประเทศไทย (TH) เหมาะสำหรับเว็บเซอร์วิสเฉพาะในประเทศเพื่อกรองบอทต่างชาติ',
        category: 'compliance',
        icon: 'i-heroicons-globe-alt',
        action: 'managed_challenge',
        expression: 'not (ip.geoip.country in {"TH"})',
        recommended: false,
        badge: 'GEO-FENCE'
    },
    {
        id: 'block-empty-user-agent',
        title: 'Block Missing or Empty User-Agent',
        titleTh: 'บล็อกคำขอที่ไม่มี User-Agent (No User-Agent)',
        description: 'Block requests with no User-Agent header or an empty string, typical of rudimentary scripts and malicious probes.',
        descriptionTh: 'บล็อก HTTP Requests ที่ไม่ระบุ User-Agent หรือเป็นค่าว่าง ซึ่งมักเป็นบอทดิบหรือสคริปต์อัตโนมัติที่ไม่พึงประสงค์',
        category: 'bot',
        icon: 'i-heroicons-no-symbol',
        action: 'block',
        expression: '(http.user_agent eq "")',
        recommended: false,
        badge: 'BOT SHIELD'
    }
]

export const WAF_SNIPPET_HELPERS = [
    { label: 'Path contains', snippet: 'http.request.uri.path contains "/path"' },
    { label: 'User-Agent contains', snippet: 'http.user_agent contains "BotName"' },
    { label: 'Query contains', snippet: 'http.request.uri.query contains "param"' },
    { label: 'Country in', snippet: 'ip.geoip.country in {"TH" "US"}' },
    { label: 'Country not in', snippet: 'not (ip.geoip.country in {"TH"})' },
    { label: 'IP source eq', snippet: 'ip.src eq 198.51.100.4' },
    { label: 'IP source not in', snippet: 'not (ip.src in {198.51.100.4})' },
    { label: 'HTTP Method eq', snippet: 'http.request.method eq "POST"' }
]
