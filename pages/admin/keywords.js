import Head from "next/head";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/Admin/AdminLayout";

const KeywordManagement = () => {
    const [keywords, setKeywords] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingKeyword, setEditingKeyword] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Form states
    const [formData, setFormData] = useState({
        keyword_text: "",
        category_name: "",
        priority: 1,
        urls: [],
    });

    // Load data
    useEffect(() => {
        loadKeywords();
        loadCategories();
    }, [selectedCategory]);

    const loadKeywords = async () => {
        try {
            const response = await fetch(
                `/api/keywords?category=${selectedCategory}`
            );
            const result = await response.json();
            if (result.success) {
                setKeywords(result.data);
            }
        } catch (error) {
            console.error("Error loading keywords:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await fetch("/api/categories");
            const result = await response.json();
            if (result.success) {
                setCategories(result.data);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const method = editingKeyword ? "PUT" : "POST";
            const url = "/api/keywords/manage";

            const requestData = editingKeyword
                ? { keyword_id: editingKeyword.id, ...formData }
                : formData;

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            if (result.success) {
                alert(
                    editingKeyword
                        ? "키워드가 수정되었습니다."
                        : "키워드가 추가되었습니다."
                );
                setShowAddModal(false);
                setEditingKeyword(null);
                resetForm();
                loadKeywords();
            } else {
                alert(result.message || "오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Error saving keyword:", error);
            alert("오류가 발생했습니다.");
        }
    };

    const handleDelete = async (keywordId) => {
        if (!confirm("정말로 이 키워드를 삭제하시겠습니까?")) return;

        try {
            const response = await fetch("/api/keywords/manage", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ keyword_id: keywordId }),
            });

            const result = await response.json();

            if (result.success) {
                alert("키워드가 삭제되었습니다.");
                loadKeywords();
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
            category_name: keyword.category,
            priority: keyword.priority || 1,
            urls: keyword.urls || [],
        });
        setShowAddModal(true);
    };

    const resetForm = () => {
        setFormData({
            keyword_text: "",
            category_name: "",
            priority: 1,
            urls: [],
        });
    };

    const addUrl = () => {
        setFormData((prev) => ({
            ...prev,
            urls: [...prev.urls, { url: "", type: "monitor" }],
        }));
    };

    const removeUrl = (index) => {
        setFormData((prev) => ({
            ...prev,
            urls: prev.urls.filter((_, i) => i !== index),
        }));
    };

    const updateUrl = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            urls: prev.urls.map((url, i) =>
                i === index ? { ...url, [field]: value } : url
            ),
        }));
    };

    return (
        <>
            <Head>
                <title>키워드 관리 - 키워드 모니터링</title>
            </Head>

            <AdminLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            키워드 관리
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            키워드를 추가, 수정, 삭제할 수 있습니다.
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700">
                                카테고리:
                            </label>
                            <select
                                value={selectedCategory}
                                onChange={(e) =>
                                    setSelectedCategory(e.target.value)
                                }
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">전체</option>
                                {categories.map((category) => (
                                    <option
                                        key={category.name}
                                        value={category.name}
                                    >
                                        {category.display_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            키워드 추가
                        </button>
                    </div>

                    {/* Keywords Table */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                키워드 목록 ({keywords.length}개)
                            </h3>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                키워드
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                카테고리
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                URL 수
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                노출 상태
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                마지막 스캔
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                작업
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {keywords.map((keyword) => (
                                            <tr key={keyword.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {keyword.keyword}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {keyword.categoryName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {keyword.totalUrls}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            keyword.exposureStatus ===
                                                            "노출됨"
                                                                ? "bg-green-100 text-green-800"
                                                                : keyword.exposureStatus ===
                                                                  "노출 안됨"
                                                                ? "bg-red-100 text-red-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}
                                                    >
                                                        {keyword.exposureStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {keyword.scannedAt
                                                        ? new Date(
                                                              keyword.scannedAt
                                                          ).toLocaleDateString(
                                                              "ko-KR"
                                                          )
                                                        : "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(keyword)
                                                        }
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                keyword.id
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        삭제
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Add/Edit Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                                <div className="mt-3">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        {editingKeyword
                                            ? "키워드 수정"
                                            : "키워드 추가"}
                                    </h3>

                                    <form
                                        onSubmit={handleSubmit}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                키워드
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.keyword_text}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        keyword_text:
                                                            e.target.value,
                                                    })
                                                }
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                카테고리
                                            </label>
                                            <select
                                                value={formData.category_name}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        category_name:
                                                            e.target.value,
                                                    })
                                                }
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="">
                                                    카테고리 선택
                                                </option>
                                                {categories.map((category) => (
                                                    <option
                                                        key={category.name}
                                                        value={category.name}
                                                    >
                                                        {category.display_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                우선순위
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.priority}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        priority: parseInt(
                                                            e.target.value
                                                        ),
                                                    })
                                                }
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                min="1"
                                                max="10"
                                            />
                                        </div>

                                        {/* URLs */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    모니터링 URL
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={addUrl}
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    + URL 추가
                                                </button>
                                            </div>

                                            {formData.urls.map((url, index) => (
                                                <div
                                                    key={index}
                                                    className="flex gap-2 mb-2"
                                                >
                                                    <input
                                                        type="url"
                                                        value={url.url}
                                                        onChange={(e) =>
                                                            updateUrl(
                                                                index,
                                                                "url",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="https://example.com"
                                                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                                                    />
                                                    <select
                                                        value={url.type}
                                                        onChange={(e) =>
                                                            updateUrl(
                                                                index,
                                                                "type",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                                                    >
                                                        <option value="monitor">
                                                            모니터링
                                                        </option>
                                                        <option value="target">
                                                            타겟
                                                        </option>
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeUrl(index)
                                                        }
                                                        className="text-red-600 hover:text-red-800 px-2"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAddModal(false);
                                                    setEditingKeyword(null);
                                                    resetForm();
                                                }}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                            >
                                                취소
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                            >
                                                {editingKeyword
                                                    ? "수정"
                                                    : "추가"}
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
