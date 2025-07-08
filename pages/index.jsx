import Head from "next/head";
import KeywordDashboard from "../components/KeywordDashboard";

export default function Home() {
    return (
        <>
            <Head>
                <title>키워드 노출 대시보드</title>
                <meta
                    name="description"
                    content="키워드 노출 상태를 추적하는 대시보드"
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="min-h-screen bg-gray-50">
                <div className="container mx-auto py-8">
                    <KeywordDashboard />
                </div>
            </main>
        </>
    );
}
