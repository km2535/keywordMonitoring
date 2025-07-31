// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/components/KeywordDashboard/KeywordQuickAddModal.jsx
import { useState } from "react";

/**
 * 키워드 빠른 추가 모달 컴포넌트
 */
const KeywordQuickAddModal = ({ isOpen, onClose, categories, onSuccess }) => { // categories는 이제 'all'만 있으므로, 실제 사용 안 함
    const [formData, setFormData] = useState({
        keyword_text: "",
        category_name: "all", // 기본값 'all'로 고정
        priority: 1, // 우선순위는 Notion Select 속성으로 문자열이어야 함
        urls: [""],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const resetForm = () => {
        setFormData({
            keyword_text: "",
            category_name: "all",
            priority: 1,
            urls: [""],
        });
        setError("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const addUrlField = () => {
        setFormData(prev => ({
            ...prev,
            urls: [...prev.urls, ""]
        }));
    };

    const removeUrlField = (index) => {
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
                .map(url => ({ url: url.trim(), type: "monitor" })); // Notion API는 단일 URL 문자열만 받음

            const requestData = {
                keyword_text: formData.keyword_text.trim(),
                category_name: formData.category_name, // 서버에서 처리되지 않을 수 있음
                priority: String(formData.priority), // Notion Select는 문자열
                urls: cleanUrls.length > 0 ? cleanUrls[0].url : null, // Notion URL 속성 (단일)
            };

            const response = await fetch("/api/keywords/manage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            if (result.success) {
                alert("키워드가 성공적으로 추가되었습니다!");
                handleClose();
                if (onSuccess) onSuccess();
            } else {
                setError(result.message || "키워드 추가 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Error adding keyword:", error);
            setError("네트워크 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                            새 키워드 추가
                        </h3>
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

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-red-700 text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                키워드 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.keyword_text}
                                onChange={(e) => setFormData(prev => ({ ...prev, keyword_text: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="예: 폐암 치료"
                                required
                            />
                        </div>

                        {/* 카테고리 필드 제거 (통합 관리) */}
                        {/* <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                카테고리 <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.category_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                required
                            >
                                <option value="">카테고리 선택</option>
                                {Object.entries(categories).map(([id, category]) => (
                                    <option key={id} value={id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div> */}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            우선순위
                        </label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            {[1, 2, 3, 4, 5].map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-sm text-gray-500">1이 가장 높은 우선순위입니다</p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                모니터링 URL
                            </label>
                            <button
                                type="button"
                                onClick={addUrlField}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                            >
                                + URL 추가
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {formData.urls.map((url, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => updateUrl(index, e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="https://example.com"
                                    />
                                    {formData.urls.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeUrlField(index)}
                                            className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
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
                            URL은 선택사항입니다. 나중에 추가할 수도 있습니다.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            disabled={isSubmitting}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.keyword_text.trim()} // 카테고리 필수 조건 제거
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

export default KeywordQuickAddModal;