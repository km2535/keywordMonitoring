import { useState } from "react";
import useKeywordData from "../../hooks/useKeywordData";
import {
    CategorySelector,
    ErrorMessage,
    LoadingSpinner,
    TabNavigation,
} from "../common";
import { KeywordListView } from "../common/KeywordList";
import {
    CategoryCharts,
    CategorySummaryTable,
    SummaryCards,
    SummaryCharts,
} from "../common/Summary";

// Dashboard tabs
const TABS = [
    { id: "summary", label: "요약" },
    { id: "keywordList", label: "키워드 목록" },
];

/**
 * Main dashboard component for Next.js
 */
const KeywordDashboard = () => {
    const {
        data,
        rawData,
        loading,
        error,
        activeCategory,
        setActiveCategory,
        categories,
    } = useKeywordData();
    const [activeTab, setActiveTab] = useState("summary");

    // Handle page reload
    const handleRetry = () => {
        window.location.reload();
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorMessage message={error} onRetry={handleRetry} />;
    }

    if (!data) {
        return (
            <ErrorMessage
                message="데이터를 불러올 수 없습니다."
                onRetry={handleRetry}
            />
        );
    }

    // Get category list for components
    const categoryList = Object.keys(categories).map((id) => ({
        id,
        name: categories[id].name,
    }));

    return (
        <div className="p-6 bg-gray-50 rounded-lg max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-2 text-center text-blue-800">
                키워드 노출 여부 대시보드
            </h1>
            <p className="text-center text-gray-600 mb-4">
                {activeCategory === "all"
                    ? "모든 카테고리 데이터"
                    : `${
                          categories[activeCategory]?.name || activeCategory
                      } 카테고리 데이터`}
                {data.timestamp &&
                    ` (${new Date(data.timestamp).toLocaleString("ko-KR")})`}
            </p>

            {/* Category selector */}
            <CategorySelector
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                categories={categories}
            />

            {/* Tab navigation */}
            <TabNavigation
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Tab content */}
            {activeTab === "summary" && (
                <div>
                    {/* Summary cards */}
                    <SummaryCards summary={data.summary} />

                    {/* Category summary table */}
                    {rawData && (
                        <CategorySummaryTable
                            rawData={rawData}
                            categories={categories}
                        />
                    )}

                    {/* Summary charts for current selection */}
                    <SummaryCharts summary={data.summary} />

                    {/* Category-specific charts */}
                    {activeCategory === "all" && rawData && (
                        <CategoryCharts
                            rawData={rawData}
                            categories={categories}
                        />
                    )}
                </div>
            )}

            {activeTab === "keywordList" && (
                <KeywordListView
                    keywordsData={data.keywordsData}
                    activeCategory={activeCategory}
                    categories={categoryList}
                />
            )}
        </div>
    );
};

export default KeywordDashboard;
