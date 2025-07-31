// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/components/common/Summary/CategorySummaryTable.jsx
import { exportSummaryToExcel } from "../../../utils/exportUtils"; // utils/exportUtils.js 파일도 필요하다면 수정해야 함 (getCategoryLabel 등)

/**
 * Component for displaying summary statistics by category
 */
const CategorySummaryTable = ({ rawData, categories }) => {
    // rawData.categoryData는 이제 { 'R1': {stats}, 'R2': {stats}, ...} 형태
    // categories는 { 'all': {}, 'R1': {}, ... } 형태
    if (!rawData || !rawData.allSummary || !rawData.categoryData) {
        return null;
    }

    const allSummary = rawData.allSummary;
    const categoryData = rawData.categoryData; // 'R' 값별 통계 데이터

    // Excel 내보내기 핸들러
    const handleExportSummary = () => {
        // exportSummaryToExcel 함수가 categoryData를 어떻게 처리하는지 확인 필요
        // 만약 기존 카테고리 이름을 기대한다면, 'R' 값을 기존 카테고리 이름으로 매핑하는 로직이 필요
        exportSummaryToExcel(categoryData); // 모든 R 값별 데이터를 그대로 전달
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700">
                    카테고리별 요약 (R 값)
                </h2>
                <button
                    onClick={handleExportSummary}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center text-sm"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    Excel로 내보내기
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                카테고리 (R 값)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                총 키워드 수
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                URL 있는 키워드
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                노출된 키워드
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                노출 성공률
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* 'all' 카테고리 요약 */}
                        <tr className="bg-blue-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                전체
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {allSummary.totalKeywords}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {allSummary.keywordsWithUrls}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {allSummary.exposedKeywords}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    {allSummary.exposureSuccessRate}%
                                </span>
                            </td>
                        </tr>

                        {/* 개별 R 값 카테고리 요약 */}
                        {Object.entries(categoryData).map(([rValue, stats]) => {
                            // 'all' 카테고리는 위에서 처리했으므로 여기서는 건너뜜
                            if (rValue === "all") return null;

                            return (
                                <tr key={rValue} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {rValue}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {stats.totalKeywords}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {stats.keywordsWithUrls}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {stats.exposedKeywords}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span
                                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                stats.exposureSuccessRate > 70
                                                    ? "bg-green-100 text-green-800"
                                                    : stats.exposureSuccessRate > 40
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {stats.exposureSuccessRate}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CategorySummaryTable;