// km2535/keywordmonitoring/keywordMonitoring-7dd76531bb759dbc7bc76a1ffe621814538d8846/components/common/KeywordList/KeywordItem.jsx
import React from "react";

/**
 * Component for displaying individual keyword items
 */
const KeywordItem = ({ item, index }) => {
    // Notion의 새로운 상태 옵션에 맞게 업데이트
    const getStatusClass = (status) => {
        switch (status) {
            case "최상단 노출": return "bg-green-100 text-green-800";
            case "노출X": return "bg-red-100 text-red-800";
            case "저품질": return "bg-purple-100 text-purple-800";
            case "미발행": return "bg-gray-100 text-gray-800";
            default: return "bg-yellow-100 text-yellow-800"; // 미확인
        }
    };

    const writtenUrls = item.urls.filter(url => url.urlType === '작성글');
    const originalUrls = item.urls.filter(url => url.urlType === '기존글');

    return (
        <div className={`p-4 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900 mr-2">
                        {item.keyword}
                    </h3>
                </div>
                <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                        item.exposureStatus
                    )}`}
                >
                    {item.exposureStatus}
                </span>
            </div>

            {/* 작성글 URL 표시 */}
            {writtenUrls.length > 0 && (
                <div className="mt-2">
                    <p className="text-sm font-semibold text-gray-700">
                        작성글 URL:
                    </p>
                    <ul className="space-y-1 mt-1">
                        {writtenUrls.map((urlItem, urlIndex) => (
                            <li key={urlIndex} className="text-sm">
                                <a
                                    href={urlItem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    {urlItem.url}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 기존글 URL은 숨겨서 표시 */}
            {originalUrls.length > 0 && (
                <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                        기존글 URL 보기 ({originalUrls.length}개)
                    </summary>
                    <div className="mt-2 pl-4 bg-gray-100 p-3 rounded-lg">
                        <ul className="space-y-1">
                            {originalUrls.map((urlItem, urlIndex) => (
                                <li key={urlIndex} className="text-sm">
                                    <a
                                        href={urlItem.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-600 hover:underline"
                                    >
                                        {urlItem.url}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </details>
            )}

            {item.totalUrls === 0 && (
                <p className="text-sm text-gray-500 italic">URL 없음</p>
            )}
        </div>
    );
};

export default KeywordItem;