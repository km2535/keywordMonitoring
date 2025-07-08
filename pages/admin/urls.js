import Head from "next/head";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/Admin/AdminLayout";

const URLManagement = () => {
    const [urls, setUrls] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUrl, setEditingUrl] = useState(null);
    const [selectedKeyword, setSelectedKeyword] = useState("all");

    // Form states
    const [formData, setFormData] = useState({
        keyword_id: "",
        target_url: "",
        url_type: "monitor",
        is_active: true,
    });

    // Load data
    useEffect(() => {
        loadUrls();
        loadKeywords();
    }, [selectedKeyword]);

    const loadUrls = async () => {
        try {
            const response = await fetch(
                `/api/urls?keyword=${selectedKeyword}`
            );
            const result = await response.json();
            if (result.success) {
                setUrls(result.data);
            }
        } catch (error) {
            console.error("Error loading URLs:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadKeywords = async () => {
        try {
            const response = await fetch("/api/keywords?category=all");
            const result = await response.json();
            if (result.success) {
                setKeywords(result.data);
            }
        } catch (error) {
            console.error("Error loading keywords:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const method = editingUrl ? "PUT" : "POST";
            const url = "/api/urls/manage";

            const requestData = editingUrl
                ? { url_id: editingUrl.id, ...formData }
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
                    editingUrl
                        ? "URL이 수정되었습니다."
                        : "URL이 추가되었습니다."
                );
                setShowAddModal(false);
                setEditingUrl(null);
                resetForm();
                loadUrls();
            } else {
                alert(result.message || "오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Error saving URL:", error);
            alert("오류가 발생했습니다.");
        }
    };

    const handleDelete = async (urlId) => {
        if (!confirm("정말로 이 URL을 삭제하시겠습니까?")) return;

        try {
            const response = await fetch("/api/urls/manage", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url_id: urlId }),
            });

            const result = await response.json();

            if (result.success) {
                alert("URL이 삭제되었습니다.");
                loadUrls();
            } else {
                alert(result.message || "삭제 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Error deleting URL:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const handleEdit = (url) => {
        setEditingUrl(url);
        setFormData({
            keyword_id: url.keyword_id,
            target_url: url.target_url,
            url_type: url.url_type,
            is_active: url.is_active,
        });
        setShowAddModal(true);
    };

    const resetForm = () => {
        setFormData({
            keyword_id: "",
            target_url: "",
            url_type: "monitor",
            is_active: true,
        });
    };

    const getKeywordName = (keywordId) => {
        const keyword = keywords.find((k) => k.id === keywordId);
        return keyword ? keyword.keyword : "Unknown";
    };

    return (
        <>
            <Head>
                <title>URL 관리 - 키워드 모니터링</title>
            </Head>

            <AdminLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            URL 관리
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            키워드별 모니터링 URL을 관리할 수 있습니다.
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700">
                                키워드 필터:
                            </label>
                            <select
                                value={selectedKeyword}
                                onChange={(e) =>
                                    setSelectedKeyword(e.target.value)
                                }
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">전체</option>
                                {keywords.map((keyword) => (
                                    <option key={keyword.id} value={keyword.id}>
                                        {keyword.keyword} (
                                        {keyword.categoryName})
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
                            URL 추가
                        </button>
                    </div>

                    {/* URLs Table */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                URL 목록 ({urls.length}개)
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
                                                URL
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                키워드
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                타입
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                상태
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                노출 여부
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
                                        {urls.map((url) => (
                                            <tr key={url.id}>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 max-w-xs truncate">
                                                        <a
                                                            href={
                                                                url.target_url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            {url.target_url}
                                                        </a>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {getKeywordName(
                                                            url.keyword_id
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            url.url_type ===
                                                            "monitor"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : "bg-green-100 text-green-800"
                                                        }`}
                                                    >
                                                        {url.url_type ===
                                                        "monitor"
                                                            ? "모니터링"
                                                            : "타겟"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            url.is_active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {url.is_active
                                                            ? "활성"
                                                            : "비활성"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            url.is_exposed ===
                                                            true
                                                                ? "bg-green-100 text-green-800"
                                                                : url.is_exposed ===
                                                                  false
                                                                ? "bg-red-100 text-red-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}
                                                    >
                                                        {url.is_exposed === true
                                                            ? "노출됨"
                                                            : url.is_exposed ===
                                                              false
                                                            ? "노출 안됨"
                                                            : "미확인"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {url.last_scanned
                                                        ? new Date(
                                                              url.last_scanned
                                                          ).toLocaleDateString(
                                                              "ko-KR"
                                                          )
                                                        : "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(url)
                                                        }
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(url.id)
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
                                        {editingUrl ? "URL 수정" : "URL 추가"}
                                    </h3>

                                    <form
                                        onSubmit={handleSubmit}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                키워드
                                            </label>
                                            <select
                                                value={formData.keyword_id}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        keyword_id:
                                                            e.target.value,
                                                    })
                                                }
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="">
                                                    키워드 선택
                                                </option>
                                                {keywords.map((keyword) => (
                                                    <option
                                                        key={keyword.id}
                                                        value={keyword.id}
                                                    >
                                                        {keyword.keyword} (
                                                        {keyword.categoryName})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                URL
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.target_url}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        target_url:
                                                            e.target.value,
                                                    })
                                                }
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="https://example.com"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                타입
                                            </label>
                                            <select
                                                value={formData.url_type}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        url_type:
                                                            e.target.value,
                                                    })
                                                }
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="monitor">
                                                    모니터링
                                                </option>
                                                <option value="target">
                                                    타겟
                                                </option>
                                            </select>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                checked={formData.is_active}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        is_active:
                                                            e.target.checked,
                                                    })
                                                }
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label
                                                htmlFor="is_active"
                                                className="ml-2 block text-sm text-gray-900"
                                            >
                                                활성 상태
                                            </label>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAddModal(false);
                                                    setEditingUrl(null);
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
                                                {editingUrl ? "수정" : "추가"}
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

export default URLManagement;
