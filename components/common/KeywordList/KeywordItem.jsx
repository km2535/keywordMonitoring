// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/components/common/KeywordList/KeywordItem.jsx
import React from "react";

/**
 * Component for displaying individual keyword items
 */
const KeywordItem = ({ item, index, categories }) => { // categories는 이제 단일 'all'만 있으므로, 사실상 사용 안 함
    // Get category name for display (이제 사용하지 않거나, 'all'로 고정)
    // const getCategoryName = (categoryId) => {
    //     return (
    //         categories.find((cat) => cat.id === categoryId)?.name || categoryId
    //     );
    // };

    // Get status CSS class (Notion의 새로운 상태 옵션에 맞게 업데이트)
    const getStatusClass = (status) => {
        switch (status) {
            case "최상단 노출": return "bg-green-100 text-green-800";
            case "노출X": return "bg-red-100 text-red-800";
            case "저품질": return "bg-purple-100 text-purple-800";
            case "미발행": return "bg-gray-100 text-gray-800";
            default: return "bg-yellow-100 text-yellow-800"; // 미확인
        }
    };

    // URL 상태 뱃지 (Notion의 exposureStatus 기반으로 단순화)
    const getUrlStatusBadge = (url) => {
        // Notion에서 isExposed가 직접 오지 않고, exposureStatus가 전체 키워드에 대한 상태이므로,
        // URL 리스트에서는 단순히 해당 URL이 노출 상태를 갖는지 여부만 표시.
        // 또는 url.isExposed (API에서 처리된 불리언) 값을 사용
        if (url.isExposed === true) {
            return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">노출</span>;
        } else if (url.isExposed === false) {
            return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">미노출</span>;
        } else {
            return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">미확인</span>;
        }
    };


    return (
        <div className={`p-4 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900 mr-2">
                        {item.keyword}
                    </h3>
                    {/* 카테고리 뱃지 제거 (통합 관리) */}
                    {/* <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {getCategoryName(item.category)}
                    </span> */}
                </div>
                <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                        item.exposureStatus // Notion에서 온 상태 그대로 사용
                    )}`}
                >
                    {item.exposureStatus}
                </span>
            </div>

            {item.totalUrls > 0 ? (
                <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">
                        URL 목록 ({item.totalUrls}개):
                    </p>
                    <ul className="space-y-1">
                        {item.urls.map((urlItem, urlIndex) => (
                            <li
                                key={urlIndex}
                                className="text-sm flex items-center"
                            >
                                <span
                                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                        urlItem.isExposed // API에서 isExposed를 불리언으로 반환
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                    }`}
                                ></span>
                                <a
                                    href={urlItem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-blue-600 hover:underline ${
                                        urlItem.isExposed ? "font-medium" : ""
                                    }`}
                                >
                                    {urlItem.url}
                                </a>
                                {getUrlStatusBadge(urlItem)} {/* URL 개별 상태 뱃지 */}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">URL 없음</p>
            )}
        </div>
    );
};

export default KeywordItem;