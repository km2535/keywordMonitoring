import { useEffect, useState } from "react";
import useKeywordData from "../../hooks/useKeywordData";

/**
 * Enhanced Dashboard with additional features
 */
const EnhancedDashboard = () => {
    const { data, loading, error } = useKeywordData();
    const [scanSessions, setScanSessions] = useState([]);
    const [exposureTrends, setExposureTrends] = useState([]);
    const [loadingExtended, setLoadingExtended] = useState(false);

    // Fetch additional data for enhanced features
    useEffect(() => {
        const fetchExtendedData = async () => {
            try {
                setLoadingExtended(true);

                const [sessionsResponse, trendsResponse] = await Promise.all([
                    fetch("/api/scan-sessions?limit=10"),
                    fetch("/api/exposure-trends?days=30&limit=50"),
                ]);

                const sessionsData = await sessionsResponse.json();
                const trendsData = await trendsResponse.json();

                if (sessionsData.success) {
                    setScanSessions(sessionsData.data);
                }

                if (trendsData.success) {
                    setExposureTrends(trendsData.data.trends);
                }
            } catch (error) {
                console.error("Error fetching extended data:", error);
            } finally {
                setLoadingExtended(false);
            }
        };

        if (data && !loading) {
            fetchExtendedData();
        }
    }, [data, loading]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 rounded-lg">
                <h2 className="text-xl font-bold text-red-800 mb-2">
                    오류 발생
                </h2>
                <p className="text-red-700">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Enhanced Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-sm font-medium opacity-90">
                        총 키워드
                    </h3>
                    <p className="text-3xl font-bold">
                        {data?.summary?.totalKeywords || 0}
                    </p>
                    <p className="text-sm opacity-75 mt-1">
                        활성: {data?.summary?.keywordsWithUrls || 0}
                    </p>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-sm font-medium opacity-90">
                        노출 성공률
                    </h3>
                    <p className="text-3xl font-bold">
                        {data?.summary?.exposureSuccessRate || 0}%
                    </p>
                    <p className="text-sm opacity-75 mt-1">
                        노출됨: {data?.summary?.exposedKeywords || 0}
                    </p>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-sm font-medium opacity-90">총 URL</h3>
                    <p className="text-3xl font-bold">
                        {data?.summary?.totalUrls || 0}
                    </p>
                    <p className="text-sm opacity-75 mt-1">
                        노출: {data?.summary?.exposedUrls || 0}
                    </p>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-sm font-medium opacity-90">
                        평균 노출률
                    </h3>
                    <p className="text-3xl font-bold">
                        {data?.summary?.averageExposureRate || 0}%
                    </p>
                    <p className="text-sm opacity-75 mt-1">최근 스캔 기준</p>
                </div>
            </div>

            {/* Recent Scan Sessions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                    최근 스캔 세션
                </h2>

                {loadingExtended ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        세션명
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        카테고리
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
                                {scanSessions.map((session, index) => (
                                    <tr
                                        key={index}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {session.session_name ||
                                                `세션 ${session.session_id}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {session.category_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{
                                                            width: `${
                                                                (session.processed_keywords /
                                                                    session.total_keywords) *
                                                                100
                                                            }%`,
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs">
                                                    {session.processed_keywords}
                                                    /{session.total_keywords}
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
                                                {session.success_rate_percent}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {session.duration_minutes
                                                ? `${session.duration_minutes}분`
                                                : "진행중"}
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

            {/* Exposure Trends */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                    노출 상태 변화 로그
                </h2>

                {loadingExtended ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {exposureTrends.map((trend, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center mb-1">
                                        <span className="font-medium text-gray-900 mr-2">
                                            {trend.keyword_text}
                                        </span>
                                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                            {trend.category_name}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">
                                        {trend.target_url}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="text-right">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                trend.change_type ===
                                                "newly_exposed"
                                                    ? "bg-green-100 text-green-800"
                                                    : trend.change_type ===
                                                      "newly_hidden"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-blue-100 text-blue-800"
                                            }`}
                                        >
                                            {trend.change_type ===
                                            "newly_exposed"
                                                ? "신규 노출"
                                                : trend.change_type ===
                                                  "newly_hidden"
                                                ? "노출 중단"
                                                : "순위 변경"}
                                        </span>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Date(
                                                trend.changed_at
                                            ).toLocaleString("ko-KR")}
                                        </div>
                                    </div>
                                    {trend.exposure_rank && (
                                        <div className="text-sm font-semibold text-blue-600">
                                            #{trend.exposure_rank}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedDashboard;
