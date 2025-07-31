// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/components/common/Summary/CategoryCharts.jsx
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
} from "chart.js";
import { Pie } from "recharts";

// Chart.js 모듈 등록
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

/**
 * Component for displaying summary charts by category
 */
const CategoryCharts = ({ rawData, categories }) => { // categories는 { 'all': {}, 'R1': {}, ...} 형태
    if (!rawData || !rawData.categoryData) {
        return null;
    }

    const categoryData = rawData.categoryData;

    // 'all' 카테고리를 제외한 실제 'R' 값 카테고리만 필터링
    const rCategories = Object.entries(categoryData).filter(([rValue]) => rValue !== 'all');

    // 각 'R' 카테고리별 차트 데이터 생성
    const getChartData = (stats) => {
        return {
            labels: ["노출된 키워드", "노출 안된 키워드", "URL 없는 키워드"],
            datasets: [
                {
                    data: [
                        stats.exposedKeywords,
                        stats.notExposedKeywords,
                        stats.noUrlKeywords,
                    ],
                    backgroundColor: [
                        "rgba(75, 192, 192, 0.6)", // exposed
                        "rgba(255, 99, 132, 0.6)", // not exposed
                        "rgba(200, 200, 200, 0.6)", // no URL
                    ],
                    borderColor: [
                        "rgba(75, 192, 192, 1)",
                        "rgba(255, 99, 132, 1)",
                        "rgba(200, 200, 200, 1)",
                    ],
                    borderWidth: 1,
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.label || "";
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value}개 (${percentage}%)`;
                    },
                },
            },
        },
    };

    if (rCategories.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow mb-6 text-center text-gray-500">
                <p>표시할 카테고리별 차트 데이터가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
                카테고리별 노출 현황 (파이 차트)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rCategories.map(([rValue, stats]) => (
                    <div key={rValue} className="p-4 border border-gray-200 rounded-lg shadow-sm">
                        <h3 className="text-md font-bold text-gray-800 mb-3 text-center">{rValue}</h3>
                        <div className="h-64"> {/* 차트 높이 고정 */}
                            {stats.totalKeywords > 0 ? (
                                <Pie data={getChartData(stats)} options={chartOptions} />
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