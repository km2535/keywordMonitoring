// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,

    // MySQL 연결을 위한 설정은 더 이상 필요 없으므로 제거
    // experimental: {
    //     serverComponentsExternalPackages: ["mysql2"],
    // },

    // 환경 변수 설정 (이제 Notion 관련 변수만 명시)
    env: {
        NOTION_API_KEY: process.env.NOTION_API_KEY,
        NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
        // DB_HOST: process.env.DB_HOST, // MySQL 관련 제거
        // DB_PORT: process.env.DB_PORT, // MySQL 관련 제거
        // DB_USER: process.env.DB_USER, // MySQL 관련 제거
        // DB_PASSWORD: process.env.DB_PASSWORD, // MySQL 관련 제거
        // DB_NAME: process.env.DB_NAME, // MySQL 관련 제거
    },

    // API 라우트 설정 (변경 없음)
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "/api/:path*",
            },
        ];
    },

    // 정적 파일 최적화 (변경 없음)
    images: {
        domains: [],
        unoptimized: true,
    },
};

module.exports = nextConfig;