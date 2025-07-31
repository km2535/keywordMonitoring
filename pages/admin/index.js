// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/pages/admin/index.js
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/Admin/AdminLayout";
// useKeywordData 훅에서 통계와 키워드 데이터를 가져옵니다.
import useKeywordData from "../../hooks/useKeywordData"; 
import LoadingSpinner from "../../components/common/LoadingSpinner"; // LoadingSpinner 임포트

const AdminDashboard = () => {
    // useKeywordData 훅을 사용하여 Notion 기반 데이터를 가져옵니다.
    const { data, loading, error, refreshData } = useKeywordData();

    // MySQL 기반 통계는 더 이상 사용하지 않습니다.
    // const [stats, setStats] = useState({
    //     totalCategories: 0,
    //     totalKeywords: 0,
    //     totalUrls: 0,
    //     activeSessions: 0,
    //     recentActivity: [],
    // });
    // const [loading, setLoading] = useState(true);

    // useEffect(() => {
    //     loadDashboardStats();
    // }, []);

    // loadDashboardStats 함수는 더 이상 필요 없음
    // const loadDashboardStats = async () => { ... }

    const quickActions = [
        {
            title: "키워드 추가",
            description: "새로운 키워드를 추가하고 모니터링을 시작하세요",
            href: "/admin/keywords",
            icon: "🔍",
            color: "bg-blue-500",
        },
        {
            title: "URL 관리", // 이 페이지도 MySQL 기반이므로, 필요시 제거하거나 Notion 연동 후 활성화
            description: "키워드별 모니터링 URL을 관리하세요",
            href: "/admin/urls",
            icon: "🔗",
            color: "bg-green-500",
        },
        {
            title: "카테고리 설정", // 이제 Notion에서 통합 관리하므로, 필요시 제거하거나 Notion 연동 후 활성화
            description: "키워드를 분류할 카테고리를 관리하세요",
            href: "/admin/categories",
            icon: "📁",
            color: "bg-purple-500",
        },
        {
            title: "스캔 결과", // MySQL 기반이므로, 필요시 제거하거나 Notion 연동 후 활성화
            description: "최근 스캔 결과와 트렌드를 확인하세요",
            href: "/admin/scan-sessions",
            icon: "⚡",
            color: "bg-orange-500",
        },
    ];

    // useKeywordData의 로딩 상태를 사용
    if (loading) {
        return (
            <AdminLayout>
                <LoadingSpinner message="대시보드 데이터 로딩 중..." />
            </AdminLayout>
        );
    }

    // useKeywordData의 에러 상태를 사용
    if (error) {
        return (
            <AdminLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-3xl font-bold text-red-900 mb-4">오류 발생</h1>
                    <p className="text-red-700 mb-4">대시보드 데이터를 불러오는데 실패했습니다: {error}</p>
                    <button
                        onClick={refreshData}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        다시 시도
                    </button>
                </div>
            </AdminLayout>
        );
    }

    // Notion에서 가져온 요약 데이터 사용
    const summary = data?.summary || {
        totalKeywords: 0,
        exposedKeywords: 0,
        notExposedKeywords: 0,
        noUrlKeywords: 0,
        totalUrls: 0,
        exposureSuccessRate: 0,
        averageExposureRate: 0,
    };
    
    // Notion API는 스캔 세션 및 활동 로그를 직접 제공하지 않으므로, 이 부분은 더 이상 표시되지 않습니다.
    const recentActivity = []; // 빈 배열로 설정
    const activeSessions = 0; // 0으로 설정


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

                    {/* Stats Cards - Notion 기반 데이터로 업데이트 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
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
                                        {summary.totalKeywords}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            ✅
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500">
                                        노출된 키워드
                                    </dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        {summary.exposedKeywords}
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
                                        {summary.totalUrls}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            📊
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500">
                                        노출 성공률
                                    </dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        {summary.exposureSuccessRate}%
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions (변동 없음) */}
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

                    {/* Recent Activity (Notion API에서 직접 제공하지 않으므로 비활성화) */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">
                                최근 활동
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="text-center py-8 text-gray-500">
                                스캔 세션 활동은 현재 표시되지 않습니다. (Notion 연동 필요)
                            </div>
                            {/* 이전 MySQL 기반 코드 주석 처리
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : stats.recentActivity.length > 0 ? (
                                ...
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    최근 활동이 없습니다.
                                </div>
                            )}
                            */}
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </>
    );
};

export default AdminDashboard;