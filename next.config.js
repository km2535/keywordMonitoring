/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,

    // MySQL 연결을 위한 설정
    experimental: {
        serverComponentsExternalPackages: ["mysql2"],
    },

    // 환경 변수 설정
    env: {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_NAME: process.env.DB_NAME,
    },

    // API 라우트 설정
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "/api/:path*",
            },
        ];
    },

    // 정적 파일 최적화
    images: {
        domains: [],
        unoptimized: true,
    },
};

module.exports = nextConfig;
