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

// 키워드 추가 모달 컴포넌트
const KeywordAddModal = ({ isOpen, onClose, categories, onSuccess }) => {
    const [formData, setFormData] = useState({
        keyword_text: "",
        category_name: "",
        priority: 1,
        urls: [""],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleClose = () => {
        setFormData({
            keyword_text: "",
            category_name: "",
            priority: 1,
            urls: [""],
        });
        setError("");
        onClose();
    };

    const addUrl = () => {
        setFormData(prev => ({
            ...prev,
            urls: [...prev.urls, ""]
        }));
    };

    const removeUrl = (index) => {
        setFormData(prev => ({
            ...prev,
            urls: prev.urls.filter((_, i) => i !== index)
        }));
    };

    const updateUrl = (index, value) => {
        setFormData(prev => ({
            ...prev,
            urls: prev.urls.map((url, i) => i === index ? value : url)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const cleanUrls = formData.urls
                .filter(url => url.trim() !== "")
                .map(url => ({ url: url.trim(), type: "monitor" }));

            const requestData = {
                category_name: formData.category_name,
                keyword_text: formData.keyword_text.trim(),
                priority: formData.priority,
                urls: cleanUrls,
            };

            const response = await fetch("/api/keywords/manage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            if (result.success) {
                alert("키워드가 추가되었습니다!");
                handleClose();
                if (onSuccess) onSuccess();
            } else {
                setError(result.message || "오류가 발생했습니다.");
            }
        } catch (error) {
            setError("네트워크 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* 모달 헤더 */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">새 키워드 추가</h3>
                            <p className="text-sm text-gray-600 mt-1">모니터링할 키워드와 URL을 추가하세요</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 모달 내용 */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex">
                                <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-red-700 text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* 키워드와 카테고리 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    키워드 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.keyword_text}
                                    onChange={(e) => setFormData(prev => ({ ...prev, keyword_text: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="예: 폐암 치료"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    카테고리 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.category_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    required
                                >
                                    <option value="">카테고리를 선택하세요</option>
                                    {Object.entries(categories).map(([id, category]) => (
                                        <option key={id} value={id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 우선순위 */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                우선순위
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                                className="w-32 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                {[1, 2, 3, 4, 5].map(num => (
                                    <option key={num} value={num}>우선순위 {num}</option>
                                ))}
                            </select>
                            <p className="mt-2 text-sm text-gray-500">우선순위 1이 가장 높습니다</p>
                        </div>

                        {/* URL 목록 */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-semibold text-gray-700">
                                    모니터링 URL
                                </label>
                                <button
                                    type="button"
                                    onClick={addUrl}
                                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    URL 추가
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                {formData.urls.map((url, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="url"
                                            value={url}
                                            onChange={(e) => updateUrl(index, e.target.value)}
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="https://example.com"
                                        />
                                        {formData.urls.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeUrl(index)}
                                                className="px-3 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all"
                                                title="URL 삭제"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                URL은 선택사항입니다. 나중에 추가하거나 수정할 수 있습니다.
                            </p>
                        </div>
                    </div>

                    {/* 모달 푸터 */}
                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                            disabled={isSubmitting}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.keyword_text.trim() || !formData.category_name}
                            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    추가 중...
                                </span>
                            ) : (
                                '키워드 추가'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// 헤더 액션 버튼들
const HeaderActions = ({ onAddKeyword, onRefresh }) => {
    const [showDropdown, setShowDropdown] = useState(false);

    const menuItems = [
        { name: "키워드 관리", href: "/admin/keywords", icon: "🔍" },
        { name: "카테고리 관리", href: "/admin/categories", icon: "📁" },
        { name: "스캔 결과", href: "/admin/scan-sessions", icon: "⚡" },
        { name: "노출 트렌드", href: "/admin/trends", icon: "📈" },
    ];

    return (
        <div className="flex items-center gap-3">
            {/* 키워드 추가 버튼 */}
            <button
                onClick={onAddKeyword}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-lg text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                키워드 추가
            </button>

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

            {/* 관리 드롭다운 */}
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    관리
                    <svg className={`w-4 h-4 ml-1 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {showDropdown && (
                    <>
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                            <div className="py-2">
                                {menuItems.map((item, index) => (
                                    <a
                                        key={index}
                                        href={item.href}
                                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="mr-3 text-lg">{item.icon}</span>
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                    </>
                )}
            </div>
        </div>
    );
};

// 빠른 통계 카드들
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

// 디버깅 정보 (개발 중에만 표시)
const DebugInfo = ({ data, activeCategory, categories }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-left"
            >
                <span className="font-medium text-yellow-800">
                    🐛 디버깅 정보 {isExpanded ? '접기' : '펼치기'}
                </span>
                <span className="text-yellow-600">{isExpanded ? '▼' : '▶'}</span>
            </button>

            {isExpanded && (
                <div className="mt-4 space-y-3 text-sm">
                    <div>
                        <strong>현재 카테고리:</strong>
                        <span className="ml-2 font-mono bg-yellow-100 px-2 py-1 rounded">{activeCategory}</span>
                    </div>
                    <div>
                        <strong>카테고리 목록:</strong>
                        <div className="ml-2 mt-1">
                            {Object.entries(categories).map(([id, category]) => (
                                <div key={id} className="font-mono text-xs bg-yellow-100 px-2 py-1 rounded mb-1">
                                    {id} → {category.name}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <strong>데이터 요약:</strong>
                        <div className="ml-2 mt-1 font-mono text-xs bg-yellow-100 px-2 py-1 rounded">
                            키워드: {data?.summary?.totalKeywords || 0} | 
                            노출: {data?.summary?.exposedKeywords || 0} | 
                            데이터 길이: {data?.keywordsData?.length || 0}
                        </div>
                    </div>
                </div>
            )}
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
    } = useKeywordData();
    
    const [activeTab, setActiveTab] = useState("summary");
    const [showAddModal, setShowAddModal] = useState(false);

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleKeywordAdded = () => {
        window.location.reload();
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
    const categoryList = Object.keys(categories).map((id) => ({
        id,
        name: categories[id].name,
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
                                {activeCategory === "all"
                                    ? "모든 카테고리"
                                    : categories[activeCategory]?.name || "선택된 카테고리"} 
                                {data.timestamp && (
                                    <span className="text-gray-400 ml-2">
                                        • {new Date(data.timestamp).toLocaleString("ko-KR")}
                                    </span>
                                )}
                            </p>
                        </div>
                        
                        <HeaderActions 
                            onAddKeyword={() => setShowAddModal(true)}
                            onRefresh={handleRefresh}
                        />
                    </div>

                    {/* 빠른 통계 */}
                    <QuickStats summary={safeSummary} />
                </div>

                {/* 메인 콘텐츠 */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                    <div className="p-6">
                        {/* 디버깅 정보 */}
                        <DebugInfo 
                            data={data}
                            activeCategory={activeCategory}
                            categories={categories}
                        />

                        {/* 카테고리 선택기 */}
                        <CategorySelector
                            activeCategory={activeCategory}
                            setActiveCategory={setActiveCategory}
                            categories={categories}
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
                                        
                                        {rawData && (
                                            <CategorySummaryTable
                                                rawData={rawData}
                                                categories={categories}
                                            />
                                        )}

                                        <SummaryCharts summary={safeSummary} />

                                        {activeCategory === "all" && rawData && (
                                            <CategoryCharts
                                                rawData={rawData}
                                                categories={categories}
                                            />
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
                                            다양한 카테고리로 체계적으로 관리할 수 있습니다.
                                        </p>
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={() => setShowAddModal(true)}
                                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                            >
                                                </button>
                                            <a
                                                href="/admin/categories"
                                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                            >
                                                카테고리 관리
                                            </a>
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
                                        categories={categoryList}
                                    />
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="text-6xl mb-4">🔍</div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {activeCategory === "all"
                                                ? "키워드가 없습니다"
                                                : `${categories[activeCategory]?.name} 카테고리에 키워드가 없습니다`}
                                        </h3>
                                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                            새로운 키워드를 추가하여 모니터링을 시작하세요.
                                        </p>
                                        <button
                                            onClick={() => setShowAddModal(true)}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            키워드 추가하기
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 키워드 추가 모달 */}
                <KeywordAddModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    categories={categories}
                    onSuccess={handleKeywordAdded}
                />
            </div>
        </div>
    );
};

export default KeywordDashboard;