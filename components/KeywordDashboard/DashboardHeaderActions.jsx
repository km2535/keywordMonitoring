import { useState } from "react";

/**
 * 대시보드 헤더에 표시될 액션 버튼들
 */
const DashboardHeaderActions = () => {
    const [showQuickActions, setShowQuickActions] = useState(false);

    const quickActions = [
        {
            title: "키워드 관리",
            description: "키워드를 추가, 수정, 삭제합니다",
            href: "/admin/keywords",
            icon: "🔍",
            color: "bg-blue-500 hover:bg-blue-600",
        },
        {
            title: "URL 관리", 
            description: "모니터링할 URL을 관리합니다",
            href: "/admin/urls",
            icon: "🔗",
            color: "bg-green-500 hover:bg-green-600",
        },
        {
            title: "카테고리 관리",
            description: "키워드 카테고리를 관리합니다",
            href: "/admin/categories", 
            icon: "📁",
            color: "bg-purple-500 hover:bg-purple-600",
        },
        {
            title: "스캔 결과",
            description: "스캔 세션과 결과를 확인합니다",
            href: "/admin/scan-sessions",
            icon: "⚡",
            color: "bg-orange-500 hover:bg-orange-600",
        },
    ];

    return (
        <div className="relative">
            {/* 빠른 액션 드롭다운 */}
            {showQuickActions && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">빠른 작업</h3>
                        <div className="space-y-2">
                            {quickActions.map((action, index) => (
                                <a
                                    key={index}
                                    href={action.href}
                                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white text-lg mr-3 transition-colors`}>
                                        {action.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {action.title}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {action.description}
                                        </p>
                                    </div>
                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 헤더 액션 버튼들 */}
            <div className="flex items-center gap-3">
                {/* 새로고침 버튼 */}
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    title="데이터 새로고침"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    새로고침
                </button>

                {/* 관리 메뉴 버튼 */}
                <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    관리
                    <svg className={`w-4 h-4 ml-1 transition-transform ${showQuickActions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* 클릭 외부 영역 감지 */}
            {showQuickActions && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowQuickActions(false)}
                />
            )}
        </div>
    );
};

export default DashboardHeaderActions;