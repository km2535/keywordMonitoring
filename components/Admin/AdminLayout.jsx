// components/Admin/AdminLayout.jsx - URL 관리 탭 제거
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

const AdminLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();

    const navigation = [
        { name: "대시보드", href: "/", icon: "📊" },
        { name: "키워드 관리", href: "/admin/keywords", icon: "🔍" },
        { name: "카테고리 관리", href: "/admin/categories", icon: "📁" },
        { name: "스캔 세션", href: "/admin/scan-sessions", icon: "⚡" },
        { name: "노출 트렌드", href: "/admin/trends", icon: "📈" },
    ];

    const isActive = (href) => {
        return router.pathname === href;
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div
                className={`${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } 
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
            >
                <div className="flex items-center justify-center h-16 bg-blue-600 text-white">
                    <h1 className="text-xl font-bold">키워드 관리</h1>
                </div>

                <nav className="mt-6">
                    <div className="px-2 space-y-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`${
                                    isActive(item.href)
                                        ? "bg-blue-100 text-blue-700 border-r-4 border-blue-500"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                            >
                                <span className="mr-3 text-lg">
                                    {item.icon}
                                </span>
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </nav>
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center">
                                <button
                                    type="button"
                                    className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <span className="sr-only">
                                        사이드바 열기
                                    </span>
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                    </svg>
                                </button>
                                <h1 className="ml-3 text-2xl font-semibold text-gray-900">
                                    키워드 모니터링 시스템
                                </h1>
                            </div>

                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-500">
                                    {new Date().toLocaleDateString("ko-KR")}
                                </span>
                                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        관리
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="py-6">{children}</div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;