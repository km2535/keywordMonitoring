// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/components/Admin/BulkKeywordModal.jsx
import { useState } from "react";
import * as XLSX from "xlsx";

/**
 * 키워드 대량 등록 모달 컴포넌트
 */
const BulkKeywordModal = ({ isOpen, onClose, categories, onSuccess }) => {
    const [activeTab, setActiveTab] = useState("text"); // "text" 또는 "excel"
    const [formData, setFormData] = useState({
        // category_name: "", // 카테고리 필드는 더 이상 UI에 표시 안 함
        priority: 1,
        keywords: "",
        urls: "",
    });
    const [excelData, setExcelData] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");
    const [previewData, setPreviewData] = useState([]);

    const resetForm = () => {
        setFormData({
            // category_name: "",
            priority: 1,
            keywords: "",
            urls: "",
        });
        setExcelData([]);
        setPreviewData([]);
        setError("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // 텍스트 입력 방식 처리
    const handleTextSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setError("");

        try {
            if (!formData.keywords.trim()) { // 카테고리 필수 조건 제거
                setError("키워드는 필수입니다.");
                return;
            }

            const keywordLines = formData.keywords
                .split("\n")
                .map(line => line.trim())
                .filter(line => line.length > 0);

            const commonUrls = formData.urls
                .split("\n")
                .map(u => u.trim())
                .filter(u => u.length > 0);

            const keywordList = keywordLines.map(line => {
                const parts = line.split('|');
                const keyword = parts[0].trim();
                const lineUrls = parts.length > 1 
                    ? parts[1].split(',').map(u => u.trim()).filter(u => u.length > 0)
                    : [];

                const allUrls = [...commonUrls, ...lineUrls];

                return {
                    keyword_text: keyword,
                    // category_name: formData.category_name, // 서버에서 카테고리 무시
                    priority: String(formData.priority), // Notion Select는 문자열
                    urls: allUrls, // URL 리스트
                };
            });

            const bulkData = {
                keywords: keywordList,
            };

            const response = await fetch("/api/keywords/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bulkData),
            });

            const result = await response.json();

            if (result.success) {
                alert(`${result.data.successful}개의 키워드가 성공적으로 등록되었습니다.`);
                if (result.data.failed > 0) {
                    alert(`${result.data.failed}개의 키워드 등록이 실패했습니다.`);
                }
                handleClose();
                if (onSuccess) onSuccess();
            } else {
                setError(result.message || "대량 등록 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Bulk keyword registration error:", error);
            setError("네트워크 오류가 발생했습니다.");
        } finally {
            setIsProcessing(false);
        }
    };

    // 엑셀 파일 업로드 처리
    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const processedData = jsonData.map((row, index) => ({
                rowNumber: index + 1,
                keyword: row["키워드"] || row["keyword"] || "",
                category: row["카테고리"] || row["category"] || "all", // 엑셀에 카테고리 없으면 'all'로 기본값
                priority: parseInt(row["우선순위"] || row["priority"] || 1),
                urls: row["URL"] || row["urls"] || "",
                isValid: Boolean(row["키워드"] || row["keyword"]),
            }));

            setExcelData(processedData);
            setPreviewData(processedData.slice(0, 10)); // 처음 10개만 미리보기
        } catch (error) {
            console.error("Excel parsing error:", error);
            setError("엑셀 파일을 읽는 중 오류가 발생했습니다.");
        }
    };

    // 엑셀 데이터 제출
    const handleExcelSubmit = async () => {
        setIsProcessing(true);
        setError("");

        try {
            const validData = excelData.filter(row => row.isValid);
            
            if (validData.length === 0) {
                setError("유효한 키워드가 없습니다.");
                return;
            }

            const bulkData = {
                keywords: validData.map(row => ({
                    keyword_text: row.keyword,
                    category_name: row.category, // 엑셀에서 온 카테고리명 (서버에서 무시될 수 있음)
                    priority: String(row.priority), // Notion Select는 문자열
                    urls: row.urls ? row.urls.split(",").map(u => u.trim()).filter(u => u) : [],
                })),
            };

            const response = await fetch("/api/keywords/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bulkData),
            });

            const result = await response.json();

            if (result.success) {
                alert(`${result.data.successful}개의 키워드가 성공적으로 등록되었습니다.`);
                if (result.data.failed > 0) {
                    alert(`${result.data.failed}개의 키워드 등록이 실패했습니다.`);
                }
                handleClose();
                if (onSuccess) onSuccess();
            } else {
                setError(result.message || "대량 등록 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Bulk excel registration error:", error);
            setError("네트워크 오류가 발생했습니다.");
        } finally {
            setIsProcessing(false);
        }
    };

    // 엑셀 템플릿 다운로드
    const downloadTemplate = () => {
        const templateData = [
            {
                "키워드": "예시 키워드 1",
                "카테고리": "all", // 카테고리 속성 제거 또는 'all'로 통일
                "우선순위": 1,
                "URL": "https://example.com,https://example2.com"
            },
            {
                "키워드": "예시 키워드 2", 
                "카테고리": "all",
                "우선순위": 2,
                "URL": "https://example3.com"
            },
            {
                "키워드": "URL 없는 키워드",
                "카테고리": "all",
                "우선순위": 1,
                "URL": ""
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        
        ws['!cols'] = [
            { wch: 20 }, // 키워드
            { wch: 15 }, // 카테고리 (여전히 템플릿에는 표시)
            { wch: 10 }, // 우선순위
            { wch: 50 }  // URL
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "키워드 템플릿");
        XLSX.writeFile(wb, "keyword_bulk_template.xlsx");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* 모달 헤더 */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">키워드 대량 등록</h3>
                            <p className="text-sm text-gray-600 mt-1">여러 키워드를 한번에 등록할 수 있습니다</p>
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

                {/* 탭 네비게이션 */}
                <div className="px-6 pt-4">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab("text")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "text"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                📝 텍스트 입력
                            </button>
                            <button
                                onClick={() => setActiveTab("excel")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "excel"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                📊 엑셀 업로드
                            </button>
                        </nav>
                    </div>
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                            <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    </div>
                )}

                {/* 텍스트 입력 탭 */}
                {activeTab === "text" && (
                    <div className="p-6">
                        {/* 사용 가이드 */}
                        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3">📋 텍스트 입력 사용법</h4>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <h5 className="font-medium text-xs text-gray-700 mb-2">기본 형식:</h5>
                                    <pre className="text-xs bg-white p-2 rounded border text-gray-700">
{`키워드1
키워드2
키워드3`}
                                    </pre>
                                </div>
                                
                                <div>
                                    <h5 className="font-medium text-xs text-gray-700 mb-2">키워드 + URL 형식:</h5>
                                    <pre className="text-xs bg-white p-2 rounded border text-gray-700">
{`키워드1
키워드2|https://example.com
키워드3|https://site1.com,https://site2.com`}
                                    </pre>
                                </div>
                            </div>
                            
                            <div className="mt-3 text-xs text-gray-600">
                                <p><strong>규칙:</strong> 키워드와 URL을 | 로 구분, 여러 URL은 , 로 구분</p>
                            </div>
                        </div>

                        <form onSubmit={handleTextSubmit} className="space-y-6">
                            {/* 기본 설정 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 카테고리 필드 제거 */}
                                {/* <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        카테고리 <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.category_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        우선순위 (전체 적용)
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <option key={num} value={num}>우선순위 {num}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 키워드 입력 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    키워드 목록 <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.keywords}
                                    onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={10}
                                    placeholder="키워드를 한 줄에 하나씩 입력하세요.&#10;키워드만 입력하거나 키워드|URL1,URL2 형태로 입력할 수 있습니다.&#10;&#10;예시:&#10;폐암 치료&#10;당뇨병 관리|https://example.com,https://example2.com&#10;고혈압 약물|https://example3.com&#10;심장병 예방"
                                    required
                                />
                                <div className="mt-2 text-sm text-gray-500">
                                    <p className="mb-1">
                                        <strong>입력 형식:</strong>
                                    </p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li><code>키워드</code> - 키워드만 입력</li>
                                        <li><code>키워드|URL1,URL2</code> - 키워드와 개별 URL 함께 입력</li>
                                    </ul>
                                    <p className="mt-2 font-medium">
                                        총 {formData.keywords.split('\n').filter(k => k.trim()).length}개 키워드
                                    </p>
                                </div>
                            </div>

                            {/* 공통 URL 입력 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    공통 URL 목록 (선택사항)
                                </label>
                                <textarea
                                    value={formData.urls}
                                    onChange={(e) => setFormData(prev => ({ ...prev, urls: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={4}
                                    placeholder="모든 키워드에 적용할 URL을 한 줄에 하나씩 입력하세요.&#10;예시:&#10;https://example.com&#10;https://example2.com"
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                    <strong>우선순위:</strong> 개별 URL → 공통 URL 순으로 추가됩니다. 
                                    총 {formData.urls.split('\n').filter(u => u.trim()).length}개 공통 URL
                                </p>
                            </div>

                            {/* 제출 버튼 */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                    disabled={isProcessing}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessing || !formData.keywords.trim()} // 카테고리 필수 조건 제거
                                    className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            등록 중...
                                        </span>
                                    ) : (
                                        `${formData.keywords.split('\n').filter(k => k.trim()).length}개 키워드 등록`
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* 엑셀 업로드 탭 */}
                {activeTab === "excel" && (
                    <div className="p-6">
                        <div className="space-y-6">
                            {/* 엑셀 사용 가이드 */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-gray-800 mb-3">📊 엑셀 업로드 사용법</h4>
                                
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    <h5 className="font-medium text-xs text-gray-700 mb-2">엑셀 컬럼 구성:</h5>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border p-1 text-left">키워드</th>
                                                    <th className="border p-1 text-left">카테고리</th> {/* 템플릿에는 카테고리 컬럼 유지 */}
                                                    <th className="border p-1 text-left">우선순위</th>
                                                    <th className="border p-1 text-left">URL</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="border p-1">예시 키워드 1</td>
                                                    <td className="border p-1">all</td> {/* 'all'로 통일 */}
                                                    <td className="border p-1">1</td>
                                                    <td className="border p-1">https://example.com</td>
                                                </tr>
                                                <tr>
                                                    <td className="border p-1">예시 키워드 2</td>
                                                    <td className="border p-1">all</td>
                                                    <td className="border p-1">2</td>
                                                    <td className="border p-1">https://site1.com,https://site2.com</td>
                                                </tr>
                                                <tr>
                                                    <td className="border p-1">URL 없는 키워드</td>
                                                    <td className="border p-1">all</td>
                                                    <td className="border p-1">1</td>
                                                    <td className="border p-1 text-gray-400">(URL 없음)</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div className="text-xs text-gray-500 mt-2">
                                        <p><strong>규칙:</strong> 키워드는 필수, 여러 URL은 쉼표(,)로 구분, URL이 없어도 등록 가능</p>
                                    </div>
                                </div>
                            </div>
                            {/* 템플릿 다운로드 */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-blue-900">엑셀 템플릿 다운로드</h4>
                                        <p className="text-sm text-blue-700 mt-1">
                                            올바른 형식으로 키워드를 입력하기 위한 템플릿을 다운로드하세요.
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            <strong>URL 형식:</strong> 여러 URL은 쉼표(,)로 구분하여 입력하세요.
                                        </p>
                                    </div>
                                    <button
                                        onClick={downloadTemplate}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                    >
                                        📥 템플릿 다운로드
                                    </button>
                                </div>
                            </div>

                            {/* 파일 업로드 */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    엑셀 파일 업로드
                                </label>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleExcelUpload}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                    .xlsx 또는 .xls 파일을 업로드하세요. 첫 번째 시트의 데이터를 읽습니다.
                                </p>
                            </div>

                            {/* 기본 설정 (엑셀용) */}
                            {excelData.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* 기본 카테고리 필드 제거 */}
                                    {/* <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            기본 카테고리 (개별 설정이 없는 경우)
                                        </label>
                                        <select
                                            value={formData.category_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">카테고리 선택</option>
                                            {Object.entries(categories).map(([id, category]) => (
                                                <option key={id} value={id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div> */}

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            기본 우선순위
                                        </label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {[1, 2, 3, 4, 5].map(num => (
                                                <option key={num} value={num}>우선순위 {num}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* 엑셀 데이터 미리보기 */}
                            {previewData.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                        데이터 미리보기 (총 {excelData.length}개 중 {previewData.length}개)
                                    </h4>
                                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">행</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">키워드</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">우선순위</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {previewData.map((row, index) => (
                                                    <tr key={index} className={row.isValid ? "" : "bg-red-50"}>
                                                        <td className="px-4 py-2 text-sm text-gray-900">{row.rowNumber}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-900">{row.keyword}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-900">{row.category}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-900">{row.priority}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-900 truncate max-w-xs">{row.urls}</td>
                                                        <td className="px-4 py-2 text-sm">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                row.isValid 
                                                                    ? "bg-green-100 text-green-800" 
                                                                    : "bg-red-100 text-red-800"
                                                            }`}>
                                                                {row.isValid ? "유효" : "오류"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500">
                                        유효한 데이터: {excelData.filter(row => row.isValid).length}개 / 
                                        오류 데이터: {excelData.filter(row => !row.isValid).length}개
                                    </p>
                                </div>
                            )}

                            {/* 제출 버튼 */}
                            {excelData.length > 0 && (
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                        disabled={isProcessing}
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleExcelSubmit}
                                        disabled={isProcessing || excelData.filter(row => row.isValid).length === 0}
                                        className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                등록 중...
                                            </span>
                                        ) : (
                                            `${excelData.filter(row => row.isValid).length}개 키워드 등록`
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkKeywordModal;