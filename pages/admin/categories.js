import Head from "next/head";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/Admin/AdminLayout";

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleting, setDeleting] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        display_name: "",
        description: "",
        is_active: true,
    });

    // Load categories
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/categories");
            const result = await response.json();
            
            console.log("Categories loaded:", result);
            
            if (result.success) {
                setCategories(result.data);
            } else {
                console.error("Failed to load categories:", result.message);
                alert("카테고리를 불러오는데 실패했습니다: " + result.message);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
            alert("네트워크 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 기본 유효성 검사
        if (!formData.name.trim() || !formData.display_name.trim()) {
            alert("카테고리 ID와 표시 이름은 필수입니다.");
            return;
        }

        // 카테고리 ID 검증 (영문자, 숫자, 언더스코어만 허용)
        const namePattern = /^[a-zA-Z0-9_]+$/;
        if (!namePattern.test(formData.name)) {
            alert("카테고리 ID는 영문자, 숫자, 언더스코어만 사용할 수 있습니다.");
            return;
        }

        try {
            const method = editingCategory ? "PUT" : "POST";
            const url = "/api/categories/manage";

            const requestData = editingCategory
                ? { category_id: editingCategory.id, ...formData }
                : formData;

            console.log("Submitting category data:", requestData);

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();
            console.log("Submit result:", result);

            if (result.success) {
                alert(
                    editingCategory
                        ? "카테고리가 수정되었습니다."
                        : "카테고리가 추가되었습니다."
                );
                setShowAddModal(false);
                setEditingCategory(null);
                resetForm();
                loadCategories();
            } else {
                alert(result.message || "오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Error saving category:", error);
            alert("오류가 발생했습니다: " + error.message);
        }
    };

    const handleDelete = async (category) => {
        // 삭제 전 확인
        const confirmMessage = category.keyword_count > 0 
            ? `"${category.display_name}" 카테고리에는 ${category.keyword_count}개의 키워드가 있습니다.\n정말로 삭제하시겠습니까? 모든 연관된 키워드와 URL도 함께 삭제됩니다.`
            : `"${category.display_name}" 카테고리를 정말로 삭제하시겠습니까?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            setDeleting(category.id);
            console.log("Deleting category:", category.id);

            const response = await fetch("/api/categories/manage", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ category_id: category.id }),
            });

            const result = await response.json();
            console.log("Delete result:", result);

            if (result.success) {
                alert("카테고리가 삭제되었습니다.");
                loadCategories();
            } else {
                alert(result.message || "삭제 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("삭제 중 오류가 발생했습니다: " + error.message);
        } finally {
            setDeleting(null);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            display_name: category.display_name,
            description: category.description || "",
            is_active: Boolean(category.is_active),
        });
        setShowAddModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            display_name: "",
            description: "",
            is_active: true,
        });
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingCategory(null);
        resetForm();
    };

    return (
        <>
            <Head>
                <title>카테고리 관리 - 키워드 모니터링</title>
            </Head>

            <AdminLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            카테고리 관리
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            키워드를 분류하기 위한 카테고리를 관리할 수 있습니다.
                        </p>
                    </div>

                    {/* Add Button */}
                    <div className="mb-6 flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            총 {categories.length}개의 카테고리
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
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
                            카테고리 추가
                        </button>
                    </div>

                    {/* Categories Grid */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <svg
                                    className="mx-auto h-16 w-16"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                카테고리가 없습니다
                            </h3>
                            <p className="text-gray-500 mb-4">
                                첫 번째 카테고리를 추가해보세요.
                            </p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                카테고리 추가
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                {category.display_name}
                                            </h3>
                                            <p className="text-sm text-gray-500 font-mono">
                                                ID: {category.name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    category.is_active
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                                {category.is_active ? "활성" : "비활성"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 min-h-[3rem]">
                                            {category.description || "설명이 없습니다."}
                                        </p>
                                    </div>

                                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">총 키워드:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {category.keyword_count || 0}개
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">활성 키워드:</span>
                                                <span className="font-semibold text-green-600">
                                                    {category.active_keyword_count || 0}개
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                                        <span>
                                            생성: {new Date(category.created_at).toLocaleDateString("ko-KR")}
                                        </span>
                                        <span>
                                            수정: {new Date(category.updated_at).toLocaleDateString("ko-KR")}
                                        </span>
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(category)}
                                            className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                        >
                                            수정
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category)}
                                            disabled={deleting === category.id}
                                            className={`px-3 py-1 text-sm rounded transition-colors ${
                                                deleting === category.id
                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    : "bg-red-100 text-red-600 hover:bg-red-200"
                                            }`}
                                            title={
                                                category.keyword_count > 0
                                                    ? `${category.keyword_count}개의 키워드가 연결되어 있습니다. 삭제 시 모든 키워드가 함께 삭제됩니다.`
                                                    : "카테고리 삭제"
                                            }
                                        >
                                            {deleting === category.id ? (
                                                <span className="flex items-center">
                                                    <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    삭제중...
                                                </span>
                                            ) : (
                                                "삭제"
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add/Edit Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                                <div className="mt-3">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {editingCategory ? "카테고리 수정" : "카테고리 추가"}
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

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                카테고리 ID <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                                                    })
                                                }
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="예: cancer, diabetes"
                                                required
                                                disabled={!!editingCategory}
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                영문 소문자, 숫자, 언더스코어만 사용 가능 (수정 불가)
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                표시 이름 <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.display_name}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        display_name: e.target.value,
                                                    })
                                                }
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="예: 암 관련"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                설명
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        description: e.target.value,
                                                    })
                                                }
                                                rows={3}
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="카테고리에 대한 설명을 입력하세요"
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                checked={formData.is_active}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        is_active: e.target.checked,
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
                                                onClick={closeModal}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                            >
                                                취소
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                {editingCategory ? "수정" : "추가"}
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

export default CategoryManagement;