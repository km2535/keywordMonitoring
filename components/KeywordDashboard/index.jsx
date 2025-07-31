// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/components/KeywordDashboard/index.jsx
import { useState } from "react";
import useKeywordData from "../../hooks/useKeywordData";
import BulkKeywordModal from "../Admin/BulkKeywordModal";
import {
    CategorySelector, // 다시 사용
    ErrorMessage,
    LoadingSpinner,
    TabNavigation,
} from "../common";
import { KeywordListView } from "../common/KeywordList";
import {
    CategoryCharts, // 다시 사용
    CategorySummaryTable,
    SummaryCards,
    SummaryCharts,
} from "../common/Summary";
import KeywordQuickAddModal from "./KeywordQuickAddModal"; // Quick Add Modal 임포트

// 헤더 액션 버튼들 (useKeywordData에서 refreshData를 받도록 변경)
const HeaderActions = ({ onAddKeyword, onBulkAdd, onRefresh }) => {
    const [showDropdown, setShowDropdown] = useState(false);

    const menuItems = [
        { name: "키워드 관리", href: "/admin/keywords", icon: "🔍" },
        { name: "카테고리 관리", href: "/admin/categories", icon: "📁" },
        { name: "스캔 결과", href: "/admin/scan-sessions", icon: "⚡" },
        { name: "노출 트렌드", href: "/admin/trends", icon: "📈" },
    ];

    return (
        <div className="flex items-center gap-3">
            {/* 새로고침 버튼 */}
            <button
                onClick={onRefresh}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                새로고침
            </button>
        </div>
    );
};

// 빠른 통계 카드들 (변동 없음)
const QuickStats = ({ summary }) => {
    const stats = [
        {
            title: "총 키워드",
            value: summary.totalKeywords || 0,
            icon: "🏷️",
            color: "bg-blue-50 text-blue-600",
            bgColor: "bg-blue-500"
        },
        {
            title: "노출된 키워드",
            value: summary.exposedKeywords || 0,
            icon: "✅",
            color: "bg-green-50 text-green-600",
            bgColor: "bg-green-500"
        },
        {
            title: "총 URL",
            value: summary.totalUrls || 0,
            icon: "🔗",
            color: "bg-purple-50 text-purple-600",
            bgColor: "bg-purple-500"
        },
        {
            title: "노출 성공률",
            value: `${summary.exposureSuccessRate || 0}%`,
            icon: "📊",
            color: "bg-orange-50 text-orange-600",
            bgColor: "bg-orange-500"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center">
                        <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center text-white text-xl mr-4`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// 메인 대시보드 컴포넌트
const TABS = [
    { id: "summary", label: "📊 요약" },
    { id: "keywordList", label: "📝 키워드 목록" },
];

const KeywordDashboard = () => {
    const {
        data,
        rawData,
        loading,
        error,
        activeCategory,
        setActiveCategory,
        categories,
        refreshData,
    } = useKeywordData();
    
    const [activeTab, setActiveTab] = useState("summary");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);

    // 새로고침 핸들러
    const handleRefresh = () => {
        refreshData();
    };

    const handleKeywordAdded = () => {
        refreshData();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
                <ErrorMessage message={error} onRetry={handleRefresh} />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <ErrorMessage message="데이터를 불러올 수 없습니다." onRetry={handleRefresh} />
            </div>
        );
    }

    const safeSummary = data.summary || {
        totalKeywords: 0,
        keywordsWithUrls: 0,
        exposedKeywords: 0,
        notExposedKeywords: 0,
        noUrlKeywords: 0,
        totalUrls: 0,
        exposedUrls: 0,
        hiddenUrls: 0,
        errorUrls: 0,
        exposureSuccessRate: 0,
        averageExposureRate: 0,
        exposureStatsData: [
            { name: "노출됨", value: 0 },
            { name: "노출 안됨", value: 0 },
            { name: "URL 없음", value: 0 },
        ],
    };

    const safeKeywordsData = data.keywordsData || [];
    
    // categories 객체에서 배열로 변환
    const categoryListForUI = Object.keys(categories).map((id) => ({
        id,
        name: categories[id].name,
        display_name: categories[id].display_name,
    }));


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* 헤더 */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                키워드 모니터링 대시보드
                            </h1>
                            <p className="text-lg text-gray-600">
                                {categories[activeCategory]?.display_name} 모니터링
                                {data.timestamp && (
                                    <span className="text-gray-400 ml-2">
                                        • {new Date(data.timestamp).toLocaleString("ko-KR")}
                                    </span>
                                )}
                            </p>
                        </div>
                        
                        <HeaderActions 
                            onAddKeyword={() => setShowAddModal(true)}
                            onBulkAdd={() => setShowBulkModal(true)}
                            onRefresh={handleRefresh}
                        />
                    </div>

                    {/* 빠른 통계 */}
                    <QuickStats summary={safeSummary} />
                </div>

                {/* 메인 콘텐츠 */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                    <div className="p-6">
                        {/* 카테고리 선택기 다시 활성화 */}
                        <CategorySelector
                            activeCategory={activeCategory}
                            setActiveCategory={setActiveCategory}
                            categories={categoryListForUI}
                        />

                        {/* 탭 네비게이션 */}
                        <TabNavigation
                            tabs={TABS}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />

                        {/* 탭 콘텐츠 */}
                        {activeTab === "summary" && (
                            <div>
                                {safeSummary.totalKeywords > 0 ? (
                                    <>
                                        <SummaryCards summary={safeSummary} />
                                        
                                        {/* 카테고리 요약 테이블과 차트 */}
                                        {rawData && (
                                            <>
                                                <CategorySummaryTable
                                                    rawData={rawData}
                                                    categories={categories}
                                                />
                                                <CategoryCharts
                                                    rawData={rawData}
                                                    categories={categories}
                                                />
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="text-6xl mb-4">📊</div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            데이터가 없습니다
                                        </h3>
                                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                            키워드를 추가하고 모니터링을 시작해보세요. 
                                        </p>
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={() => setShowBulkModal(true)}
                                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                            >
                                                대량 등록하기
                                            </button>
                                            <button
                                                onClick={() => setShowAddModal(true)}
                                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                            >
                                                키워드 추가하기
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "keywordList" && (
                            <div>
                                {safeKeywordsData.length > 0 ? (
                                    <KeywordListView
                                        keywordsData={safeKeywordsData}
                                        activeCategory={activeCategory}
                                        categories={categoryListForUI}
                                    />
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="text-6xl mb-4">🔍</div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            키워드가 없습니다
                                        </h3>
                                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                            새로운 키워드를 추가하여 모니터링을 시작하세요.
                                        </p>
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={() => setShowBulkModal(true)}
                                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                            >
                                                대량 등록하기
                                            </button>
                                            <button
                                                onClick={() => setShowAddModal(true)}
                                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                            >
                                                키워드 추가하기
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 키워드 추가 모달 */}
                <KeywordQuickAddModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    categories={categoryListForUI} // 'all' 포함
                    onSuccess={handleKeywordAdded}
                />

                {/* 대량 등록 모달 */}
                <BulkKeywordModal
                    isOpen={showBulkModal}
                    onClose={() => setShowBulkModal(false)}
                    categories={categoryListForUI} // 'all' 포함
                    onSuccess={handleKeywordAdded}
                />
            </div>
        </div>
    );
};

export default KeywordDashboard;