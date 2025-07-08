import Head from "next/head";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/Admin/AdminLayout";

const TrendsPage = () => {
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedDays, setSelectedDays] = useState(30);
    const [categories, setCategories] = useState([]);
    const [summary, setSummary] = useState({
        newly_exposed: 0,
        newly_hidden: 0,
        rank_changed: 0,
        total_changes: 0,
    });

    useEffect(() => {
        loadTrends();
        loadCategories();
    }, [selectedCategory, selectedDays]);

    const loadTrends = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/exposure-trends?category=${selectedCategory}&days=${selectedDays}&limit=100`
            );
            const result = await response.json();
            if (result.success) {
                setTrends(result.data.trends);
                setSummary(result.data.summary);
            }
        } catch (error) {
            console.error("Error loading trends:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await fetch("/api/categories");
            const result = await response.json();
            if (result.success) {
                setCategories(result.data);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
        }
    };

    const getChangeTypeColor = (changeType) => {
        switch (changeType) {
            case "newly_exposed":
                return "bg-green-100 text-green-800";
            case "newly_hidden":
                return "bg-red-100 text-red-800";
            case "rank_changed":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getChangeTypeText = (changeType) => {
        switch (changeType) {
            case "newly_exposed":
                return "신규 노출";
            case "newly_hidden":
                return "노출 중단";
            case "rank_changed":
                return "순위 변경";
            default:
                return "기타";
        }
    };

    const getChangeTypeIcon = (changeType) => {
        switch (changeType) {
            case "newly_exposed":
                return "🎉";
            case "newly_hidden":
                return "❌";
            case "rank_changed":
                return "📈";
            default:
                return "📊";
        }
    };

    return (
        <>
            <Head>
                <title>노출 트렌드 - 키워드 모니터링</title>
            </Head>

            <AdminLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            노출 트렌드
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            키워드 노출 상태의 변화를 추적하고 분석할 수
                            있습니다.
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">
                                    기간:
                                </label>
                                <select
                                    value={selectedDays}
                                    onChange={(e) =>
                                        setSelectedDays(
                                            parseInt(e.target.value)
                                        )
                                    }
                                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={7}>최근 7일</option>
                                    <option value={30}>최근 30일</option>
                                    <option value={90}>최근 90일</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">
                                    카테고리:
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) =>
                                        setSelectedCategory(e.target.value)
                                    }
                                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">전체</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.name}
                                            value={category.name}
                                        >
                                            {category.display_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={loadTrends}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            새로고침
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            🎉
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500">
                                        신규 노출
                                    </dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        {summary.newly_exposed}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            ❌
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500">
                                        노출 중단
                                    </dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        {summary.newly_hidden}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            📈
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500">
                                        순위 변경
                                    </dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        {summary.rank_changed}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            📊
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-sm font-medium text-gray-500">
                                        총 변화
                                    </dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        {summary.total_changes}
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trends List */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">
                                변화 내역
                            </h2>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : trends.length > 0 ? (
                            <div className="max-h-96 overflow-y-auto">
                                <div className="divide-y divide-gray-200">
                                    {trends.map((trend, index) => (
                                        <div
                                            key={index}
                                            className="p-6 hover:bg-gray-50"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center mb-2">
                                                        <span className="text-2xl mr-3">
                                                            {getChangeTypeIcon(
                                                                trend.change_type
                                                            )}
                                                        </span>
                                                        <div>
                                                            <h3 className="text-lg font-medium text-gray-900">
                                                                {
                                                                    trend.keyword_text
                                                                }
                                                            </h3>
                                                            <p className="text-sm text-gray-500">
                                                                {
                                                                    trend.category_name
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mb-2">
                                                        <p className="text-sm text-gray-600 break-all">
                                                            <span className="font-medium">
                                                                URL:
                                                            </span>{" "}
                                                            {trend.target_url}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span>
                                                            {new Date(
                                                                trend.changed_at
                                                            ).toLocaleString(
                                                                "ko-KR"
                                                            )}
                                                        </span>
                                                        {trend.exposure_rank && (
                                                            <span className="font-medium text-blue-600">
                                                                #
                                                                {
                                                                    trend.exposure_rank
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="ml-4">
                                                    <span
                                                        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getChangeTypeColor(
                                                            trend.change_type
                                                        )}`}
                                                    >
                                                        {getChangeTypeText(
                                                            trend.change_type
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                선택한 기간에 변화 내역이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>
        </>
    );
};

export default TrendsPage;
