// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/pages/admin/keywords.js
import Head from "next/head";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/Admin/AdminLayout";
import useKeywordData from "../../hooks/useKeywordData"; // useKeywordData 훅 임포트

const KeywordManagement = () => {
    // useKeywordData 훅에서 필요한 데이터와 함수들을 가져옵니다.
    const { 
        data, 
        loading, 
        error, 
        activeCategory, 
        setActiveCategory, 
        categories, // 동적으로 로드된 카테고리 (R1, R2 등)
        refreshData 
    } = useKeywordData();

    const [keywords, setKeywords] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingKeyword, setEditingKeyword] = useState(null);
    const [expandedKeywords, setExpandedKeywords] = useState(new Set());

    // Form states
    const [formData, setFormData] = useState({
        keyword_text: "",
        category_name: "all", // 기본값은 'all'
        priority: 1, // 우선순위는 Notion Select 속성으로 문자열이어야 함
        urls: [{ url: "", type: "monitor" }],
    });

    // useKeywordData에서 데이터가 로드되면 keywords 상태 업데이트
    useEffect(() => {
        if (data && data.keywordsData) {
            setKeywords(data.keywordsData);
        }
    }, [data]);

    const handleRefresh = () => {
        refreshData(); // useKeywordData 훅의 refreshData 호출
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.keyword_text.trim()) {
            alert("키워드는 필수입니다.");
            return;
        }
        if (!formData.category_name || formData.category_name === "all") { // 카테고리도 필수로 만듦
            alert("카테고리(R 값)는 필수입니다.");
            return;
        }

        try {
            const method = editingKeyword ? "PUT" : "POST";
            const url = "/api/keywords/manage";

            const cleanUrls = formData.urls
                .filter(urlObj => urlObj.url.trim() !== "")
                .map(urlObj => urlObj.url.trim()); 
            
            const requestData = editingKeyword
                ? { 
                    keyword_id: editingKeyword.id, 
                    keyword_text: formData.keyword_text.trim(),
                    priority: String(formData.priority),
                    urls: cleanUrls, // URL 리스트 (manage.js에서 첫 번째만 사용)
                    category_name: formData.category_name, // R 값
                }
                : { 
                    keyword_text: formData.keyword_text.trim(),
                    category_name: formData.category_name, // R 값
                    priority: String(formData.priority),
                    urls: cleanUrls,
                };

            console.log("Submitting keyword data:", requestData);

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                closeModal();
                handleRefresh(); // 데이터 새로고침
            } else {
                alert(result.message || "오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Error saving keyword:", error);
            alert("오류가 발생했습니다: " + error.message);
        }
    };

    const handleDelete = async (keywordId, keywordText) => {
        if (!confirm(`"${keywordText}" 키워드를 정말로 삭제하시겠습니까?\n노션 데이터베이스에서 해당 페이지가 보관(archived) 처리됩니다.`)) {
            return;
        }

        try {
            const response = await fetch("/api/keywords/manage", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword_id: keywordId }), // Notion page ID
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                handleRefresh(); // 데이터 새로고침
            } else {
                alert(result.message || "삭제 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Error deleting keyword:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const handleEdit = (keyword) => {
        setEditingKeyword(keyword);
        setFormData({
            keyword_text: keyword.keyword,
            category_name: keyword.category, // 'R' 값 사용
            priority: parseInt(keyword.priority) || 1, 
            urls: keyword.urls.length > 0 
                ? keyword.urls.map(url => ({ url: url.url, type: url.urlType }))
                : [{ url: "", type: "monitor" }],
        });
        setShowAddModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingKeyword(null);
        resetForm(); // 폼 데이터 초기화
    };

    const addUrl = () => {
        setFormData(prev => ({
            ...prev,
            urls: [...prev.urls, { url: "", type: "monitor" }]
        }));
    };

    const removeUrl = (index) => {
        setFormData(prev => ({
            ...prev,
            urls: prev.urls.filter((_, i) => i !== index)
        }));
    };

    const updateUrl = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            urls: prev.urls.map((url, i) => 
                i === index ? { ...url, [field]: value } : url
            )
        }));
    };

    const toggleKeywordExpansion = (keywordId) => {
        const newExpanded = new Set(expandedKeywords);
        if (newExpanded.has(keywordId)) {
            newExpanded.delete(keywordId);
        } else {
            newExpanded.add(keywordId);
        }
        setExpandedKeywords(newExpanded);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "최상단 노출": return "bg-green-100 text-green-800";
            case "노출X": return "bg-red-100 text-red-800";
            case "저품질": return "bg-purple-100 text-purple-800";
            case "미발행": return "bg-gray-100 text-gray-800";
            default: return "bg-yellow-100 text-yellow-800";
        }
    };

    const getUrlStatusBadge = (url) => {
        if (url.isExposed === true) {
            return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">노출</span>;
        } else if (url.isExposed === false) {
            return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">미노출</span>;
        } else {
            return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">미확인</span>;
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="text-center py-12 text-red-600">
                    <p>데이터 로딩 중 오류 발생: {error}</p>
                    <button onClick={handleRefresh} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        다시 시도
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <>
            <Head>
                <title>키워드 관리 - 키워드 모니터링</title>
            </Head>

            <AdminLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">키워드 관리</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            키워드와 모니터링 URL을 통합 관리할 수 있습니다.
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            {/* 카테고리 필터 다시 활성화 */}
                            <label className="text-sm font-medium text-gray-700">카테고리:</label>
                            <select
                                value={activeCategory} // useKeywordData의 activeCategory 사용
                                onChange={(e) => setActiveCategory(e.target.value)} // useKeywordData의 setActiveCategory 사용
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {Object.values(categories).map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.display_name}
                                    </option>
                                ))}
                            </select>
                            <span className="text-sm text-gray-500">
                                총 {keywords.length}개 키워드
                            </span>
                        </div>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            키워드 추가
                        </button>
                    </div>

                    {/* Keywords List */}
                    {keywords.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg shadow">
                            <div className="text-gray-400 mb-4">
                                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">키워드가 없습니다</h3>
                            <p className="text-gray-500 mb-4">
                                첫 번째 키워드를 추가해보세요.
                            </p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                키워드 추가
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {keywords.map((keyword) => (
                                <div key={keyword.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                                    {/* 키워드 헤더 */}
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">{keyword.keyword}</h3>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        {/* 카테고리 뱃지 다시 활성화 */}
                                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            {keyword.categoryName}
                                                        </span>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(keyword.exposureStatus)}`}>
                                                            {keyword.exposureStatus}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            우선순위 {keyword.priority}
                                                        </span>
                                                        {keyword.updatedAt && (
                                                            <span className="text-xs text-gray-500">
                                                                업데이트: {new Date(keyword.updatedAt).toLocaleString('ko-KR')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                                <div className="text-right text-sm text-gray-500">
                                                    <div>URL: {keyword.totalUrls}개</div>
                                                    <div>노출: {keyword.exposedUrls}개</div>
                                                </div>
                                                
                                                <button
                                                    onClick={() => toggleKeywordExpansion(keyword.id)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                                    title={expandedKeywords.has(keyword.id) ? "URL 목록 닫기" : "URL 목록 보기"}
                                                >
                                                    <svg className={`w-5 h-5 transform transition-transform ${expandedKeywords.has(keyword.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleEdit(keyword)}
                                                    className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(keyword.id, keyword.keyword)}
                                                    className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* URL 목록 (확장 가능) */}
                                    {expandedKeywords.has(keyword.id) && (
                                        <div className="border-t border-gray-200 bg-gray-50 p-6">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">모니터링 URL 목록</h4>
                                            {keyword.urls.length > 0 ? (
                                                <div className="space-y-3">
                                                    {keyword.urls.map((url, index) => (
                                                        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <a
                                                                        href={url.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-600 hover:text-blue-800 font-medium truncate block"
                                                                        title={url.url}
                                                                    >
                                                                        {url.url}
                                                                    </a>
                                                                    <div className="flex items-center space-x-2 mt-1">
                                                                        <span className="text-xs text-gray-500">
                                                                            타입: {url.urlType === 'monitor' ? '모니터링' : '타겟'}
                                                                        </span>
                                                                        {url.scannedAt && ( 
                                                                            <span className="text-xs text-gray-500">
                                                                                스캔: {new Date(url.scannedAt).toLocaleString('ko-KR')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="ml-4">
                                                                    {getUrlStatusBadge(url)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                    </svg>
                                                    <p>등록된 URL이 없습니다.</p>
                                                    <button
                                                        onClick={() => handleEdit(keyword)}
                                                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        URL 추가하기
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add/Edit Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                                <div className="mt-3">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {editingKeyword ? "키워드 수정" : "키워드 추가"}
                                        </h3>
                                        <button
                                            onClick={closeModal}
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* 키워드 정보 */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    키워드 <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.keyword_text}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, keyword_text: e.target.value }))}
                                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>

                                            {/* 카테고리 필드 다시 활성화 (R 속성) */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    카테고리 (R 값) <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={formData.category_name}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
                                                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    required
                                                >
                                                    <option value="">카테고리 선택</option>
                                                    {/* 'all' 카테고리를 제외하고 'R' 값 옵션만 표시 */}
                                                    {Object.values(categories).filter(cat => cat.id !== "all").map((category) => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.display_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
                                            <select
                                                value={formData.priority}
                                                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                                                className="block w-32 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <option key={num} value={num}>우선순위 {num}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* URL 목록 */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="block text-sm font-medium text-gray-700">모니터링 URL</label>
                                                <button
                                                    type="button"
                                                    onClick={addUrl}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    + URL 추가
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {formData.urls.map((urlObj, index) => (
                                                    <div key={index} className="flex gap-3 items-center">
                                                        <input
                                                            type="url"
                                                            value={urlObj.url}
                                                            onChange={(e) => updateUrl(index, 'url', e.target.value)}
                                                            placeholder="https://example.com"
                                                            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                                                        />
                                                        {formData.urls.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeUrl(index)}
                                                                className="text-red-600 hover:text-red-800 p-2"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                            >
                                                취소
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isProcessing || !formData.keyword_text.trim() || !formData.category_name || formData.category_name === "all"}
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                {editingKeyword ? "수정" : "추가"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </AdminLayout>
        </>
    );
};

export default KeywordManagement;