import Head from "next/head";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/Admin/AdminLayout";

const ScanSessionsPage = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadSessions();
        loadCategories();
    }, [selectedCategory]);

    const loadSessions = async () => {
        try {
            const response = await fetch(
                `/api/scan-sessions?category=${selectedCategory}&limit=50`
            );
            const result = await response.json();
            if (result.success) {
                setSessions(result.data);
            }
        } catch (error) {
            console.error("Error loading sessions:", error);
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

    const getStatusColor = (status) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800";
            case "running":
                return "bg-blue-100 text-blue-800";
            case "failed":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "completed":
                return "완료";
            case "running":
                return "실행중";
            case "failed":
                return "실패";
            default:
                return "알 수 없음";
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes) return "-";
        if (minutes < 60) return `${minutes}분`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}시간 ${mins}분`;
    };

    return (
        <>
            <Head>
                <title>스캔 세션 관리 - 키워드 모니터링</title>
            </Head>

            <AdminLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            스캔 세션 관리
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            키워드 스캔 세션의 실행 상태와 성과를 모니터링할 수
                            있습니다.
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
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

                        <button
                            onClick={loadSessions}
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

                    {/* Sessions Table */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                스캔 세션 목록 ({sessions.length}개)
                            </h3>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                세션 ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                세션명
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                카테고리
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                상태
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                진행률
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                성공률
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                소요시간
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                시작시간
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sessions.map((session) => (
                                            <tr
                                                key={session.session_id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{session.session_id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {session.session_name ||
                                                        `세션 ${session.session_id}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {session.category_name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                            session.scan_status
                                                        )}`}
                                                    >
                                                        {getStatusText(
                                                            session.scan_status
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{
                                                                    width: `${
                                                                        session.total_keywords >
                                                                        0
                                                                            ? (session.processed_keywords /
                                                                                  session.total_keywords) *
                                                                              100
                                                                            : 0
                                                                    }%`,
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs whitespace-nowrap">
                                                            {
                                                                session.processed_keywords
                                                            }
                                                            /
                                                            {
                                                                session.total_keywords
                                                            }
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            session.success_rate_percent >
                                                            80
                                                                ? "bg-green-100 text-green-800"
                                                                : session.success_rate_percent >
                                                                  60
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {session.success_rate_percent ||
                                                            0}
                                                        %
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDuration(
                                                        session.duration_minutes
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(
                                                        session.started_at
                                                    ).toLocaleString("ko-KR")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Summary Cards */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                총 세션 수
                            </h3>
                            <p className="text-3xl font-bold text-blue-600">
                                {sessions.length}
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                완료된 세션
                            </h3>
                            <p className="text-3xl font-bold text-green-600">
                                {
                                    sessions.filter(
                                        (s) => s.scan_status === "completed"
                                    ).length
                                }
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                실행 중인 세션
                            </h3>
                            <p className="text-3xl font-bold text-orange-600">
                                {
                                    sessions.filter(
                                        (s) => s.scan_status === "running"
                                    ).length
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </>
    );
};

export default ScanSessionsPage;
