import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/Admin/AdminLayout";

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalCategories: 0,
        totalKeywords: 0,
        totalUrls: 0,
        activeSessions: 0,
        recentActivity: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardStats();
    }, []);

    const loadDashboardStats = async () => {
        try {
            const [categoriesRes, keywordsRes, urlsRes, sessionsRes] =
                await Promise.all([
                    fetch("/api/categories"),
                    fetch("/api/keywords?category=all"),
                    fetch("/api/urls?keyword=all"),
                    fetch("/api/scan-sessions?limit=5"),
                ]);

            const [categories, keywords, urls, sessions] = await Promise.all([
                categoriesRes.json(),
                keywordsRes.json(),
                urlsRes.json(),
                sessionsRes.json(),
            ]);

            setStats({
                totalCategories: categories.success
                    ? categories.data.length
                    : 0,
                totalKeywords: keywords.success ? keywords.data.length : 0,
                totalUrls: urls.success ? urls.data.length : 0,
                activeSessions: sessions.success
                    ? sessions.data.filter((s) => s.scan_status === "running")
                          .length
                    : 0,
                recentActivity: sessions.success
                    ? sessions.data.slice(0, 5)
                    : [],
            });
        } catch (error) {
            console.error("Error loading dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        {
            title: "키워드 추가",
            description: "새로운 키워드를 추가하고 모니터링을 시작하세요",
            href: "/admin/keywords",
            icon: "🔍",
            color: "bg-blue-500",
        },
        {
            title: "URL 관리",
            description: "키워드별 모니터링 URL을 관리하세요",
            href: "/admin/urls",
            icon: "🔗",
            color: "bg-green-500",
        },
        {
            title: "카테고리 설정",
            description: "키워드를 분류할 카테고리를 관리하세요",
            href: "/admin/categories",
            icon: "📁",
            color: "bg-purple-500",
        },
        {
            title: "스캔 결과",
            description: "최근 스캔 결과와 트렌드를 확인하세요",
            href: "/admin/scan-sessions",
            icon: "⚡",
            color: "bg-orange-500",
        },
    ];

    return (
        <>
            <Head>
                <title>관리자 대시보드 - 키워드 모니터링</title>
            </Head>

            <AdminLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            관리자 대시보드
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            키워드 모니터링 시스템의 전체 현황을 확인하고 관리할
                            수 있습니다.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            📁
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500">
                                        총 카테고리
                                    </dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        {loading
                                            ? "..."
                                            : stats.totalCategories}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            🔍
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500">
                                        총 키워드
                                    </dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        {loading ? "..." : stats.totalKeywords}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            🔗
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500">
                                        총 URL
                                    </dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        {loading ? "..." : stats.totalUrls}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            ⚡
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500">
                                        활성 세션
                                    </dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        {loading ? "..." : stats.activeSessions}
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            빠른 작업
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {quickActions.map((action, index) => (
                                <Link key={index} href={action.href}>
                                    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-6">
                                        <div className="flex items-center mb-3">
                                            <div
                                                className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white text-lg`}
                                            >
                                                {action.icon}
                                            </div>
                                            <h3 className="ml-3 text-lg font-medium text-gray-900">
                                                {action.title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {action.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">
                                최근 활동
                            </h2>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : stats.recentActivity.length > 0 ? (
                                <div className="flow-root">
                                    <ul className="-mb-8">
                                        {stats.recentActivity.map(
                                            (activity, index) => (
                                                <li key={index}>
                                                    <div className="relative pb-8">
                                                        {index !==
                                                            stats.recentActivity
                                                                .length -
                                                                1 && (
                                                            <span
                                                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                        <div className="relative flex space-x-3">
                                                            <div>
                                                                <span
                                                                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                                                        activity.scan_status ===
                                                                        "completed"
                                                                            ? "bg-green-500"
                                                                            : activity.scan_status ===
                                                                              "running"
                                                                            ? "bg-blue-500"
                                                                            : "bg-red-500"
                                                                    }`}
                                                                >
                                                                    <span className="text-white text-sm">
                                                                        {activity.scan_status ===
                                                                        "completed"
                                                                            ? "✓"
                                                                            : activity.scan_status ===
                                                                              "running"
                                                                            ? "⏳"
                                                                            : "✗"}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div>
                                                                    <div className="text-sm">
                                                                        <span className="font-medium text-gray-900">
                                                                            {
                                                                                activity.category_name
                                                                            }{" "}
                                                                            스캔
                                                                        </span>
                                                                        <span className="text-gray-500">
                                                                            {activity.session_name &&
                                                                                ` - ${activity.session_name}`}
                                                                        </span>
                                                                    </div>
                                                                    <p className="mt-0.5 text-sm text-gray-500">
                                                                        {activity.scan_status ===
                                                                            "completed" &&
                                                                            `${activity.processed_keywords}/${activity.total_keywords} 키워드 처리 완료`}
                                                                        {activity.scan_status ===
                                                                            "running" &&
                                                                            `${activity.processed_keywords}/${activity.total_keywords} 키워드 처리 중`}
                                                                        {activity.scan_status ===
                                                                            "failed" &&
                                                                            "스캔 실패"}
                                                                    </p>
                                                                </div>
                                                                <div className="mt-2 text-sm text-gray-700">
                                                                    <p>
                                                                        {new Date(
                                                                            activity.started_at
                                                                        ).toLocaleString(
                                                                            "ko-KR"
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    최근 활동이 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </>
    );
};

export default AdminDashboard;
