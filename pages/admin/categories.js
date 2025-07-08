import Head from "next/head";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/Admin/AdminLayout";

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

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
            const response = await fetch("/api/categories");
            const result = await response.json();
            if (result.success) {
                setCategories(result.data);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const method = editingCategory ? "PUT" : "POST";
            const url = "/api/categories/manage";

            const requestData = editingCategory
                ? { category_id: editingCategory.id, ...formData }
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
            alert("오류가 발생했습니다.");
        }
    };

    const handleDelete = async (categoryId) => {
        if (
            !confirm(
                "정말로 이 카테고리를 삭제하시겠습니까?\n연관된 모든 키워드도 함께 삭제됩니다."
            )
        )
            return;

        try {
            const response = await fetch("/api/categories/manage", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ category_id: categoryId }),
            });

            const result = await response.json();

            if (result.success) {
                alert("카테고리가 삭제되었습니다.");
                loadCategories();
            } else {
                alert(result.message || "삭제 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            display_name: category.display_name,
            description: category.description || "",
            is_active: category.is_active,
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
                            키워드를 분류하기 위한 카테고리를 관리할 수
                            있습니다.
                        </p>
                    </div>

                    {/* Add Button */}
                    <div className="mb-6 flex justify-end">
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
                            카테고리 추가
                        </button>
                    </div>

                    {/* Categories Grid */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {category.display_name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
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
                                                {category.is_active
                                                    ? "활성"
                                                    : "비활성"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 min-h-[3rem]">
                                            {category.description ||
                                                "설명이 없습니다."}
                                        </p>
                                    </div>

                                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">
                                                총 키워드:
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {category.keyword_count || 0}개
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm mt-1">
                                            <span className="text-gray-600">
                                                활성 키워드:
                                            </span>
                                            <span className="font-semibold text-green-600">
                                                {category.active_keyword_count ||
                                                    0}
                                                개
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                        <span>
                                            생성:{" "}
                                            {new Date(
                                                category.created_at
                                            ).toLocaleDateString("ko-KR")}
                                        </span>
                                        <span>
                                            수정:{" "}
                                            {new Date(
                                                category.updated_at
                                            ).toLocaleDateString("ko-KR")}
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
                                            onClick={() =>
                                                handleDelete(category.id)
                                            }
                                            className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                            disabled={
                                                category.keyword_count > 0
                                            }
                                            title={
                                                category.keyword_count > 0
                                                    ? "키워드가 연결되어 있어 삭제할 수 없습니다."
                                                    : "카테고리 삭제"
                                            }
                                        >
                                            삭제
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
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        {editingCategory
                                            ? "카테고리 수정"
                                            : "카테고리 추가"}
                                    </h3>

                                    <form
                                        onSubmit={handleSubmit}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                카테고리 ID
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        name: e.target.value,
                                                    })
                                                }
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="예: cancer, diabetes"
                                                required
                                                disabled={!!editingCategory}
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                영문자, 숫자, 언더스코어만 사용
                                                가능 (수정 불가)
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                표시 이름
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.display_name}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        display_name:
                                                            e.target.value,
                                                    })
                                                }
                                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="예: 암 관련"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                설명
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        description:
                                                            e.target.value,
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
                                                    setEditingCategory(null);
                                                    resetForm();
                                                }}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                            >
                                                취소
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                {editingCategory
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

export default CategoryManagement;
