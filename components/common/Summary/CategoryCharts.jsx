// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/components/common/Summary/CategoryCharts.jsx
import {
    PieChart,
    Pie,
    Tooltip,
    Legend,
    Cell,
    ResponsiveContainer,
} from "recharts";

/**
 * Component for displaying summary charts by category
 */
const CategoryCharts = ({ rawData, categories, activeCategory }) => { // activeCategory prop 추가
    if (!rawData || !rawData.categoryData) {
        return null; // 데이터가 없을 때 null을 반환하여 부모 컴포넌트에서 로딩 상태를 처리하도록 함
    }

    const categoryData = rawData.categoryData;

    // recharts에 맞는 데이터 형식으로 변환
    const getChartData = (stats) => {
        return [
            { name: "노출됨", value: stats.exposedKeywords, color: "#10b981" },
            { name: "노출 안됨", value: stats.notExposedKeywords, color: "#f87171" },
            { name: "URL 없음", value: stats.noUrlKeywords, color: "#6b7280" },
        ];
    };

    let chartsToRender = [];
    if (activeCategory === 'all') {
        // 'all' 카테고리일 경우, 'all' 요약을 제외한 모든 R 카테고리를 표시
        chartsToRender = Object.entries(categoryData).filter(([rValue]) => rValue !== 'all');
    } else {
        // 특정 카테고리가 선택되었을 경우 해당 카테고리만 표시
        const selectedStats = categoryData[activeCategory];
        if (selectedStats) {
            chartsToRender.push([activeCategory, selectedStats]);
        }
    }

    if (chartsToRender.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow mb-6 text-center text-gray-500">
                <p>선택한 카테고리에 대한 차트 데이터가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
                카테고리별 노출 현황 (파이 차트)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chartsToRender.map(([rValue, stats]) => (
                    <div key={rValue} className="p-4 border border-gray-200 rounded-lg shadow-sm">
                        <h3 className="text-md font-bold text-gray-800 mb-3 text-center">
                            {categories[rValue]?.display_name || rValue} {/* categories에서 display_name 가져오기 */}
                        </h3>
                        <div className="h-64"> {/* 차트 높이 고정 */}
                            {stats.totalKeywords > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={getChartData(stats)}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            fill="#8884d8"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {getChartData(stats).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>해당 카테고리에 키워드가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryCharts;