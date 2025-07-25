import { useState } from "react";
import { exportToExcel } from "../../../utils/exportUtils";

/**
 * Button for exporting keyword data to Excel
 */
const ExportButton = ({ keywordsData, categoryName }) => {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            // Small delay to allow UI to update
            await new Promise((resolve) => setTimeout(resolve, 100));

            const success = exportToExcel(
                keywordsData,
                "keyword-exposure",
                categoryName
            );
            if (success) {
                alert("엑셀 파일 내보내기가 완료되었습니다.");
            } else {
                alert("엑셀 파일 내보내기 중 오류가 발생했습니다.");
            }
        } catch (error) {
            console.error("Excel 내보내기 오류:", error);
            alert("엑셀 파일 내보내기 중 오류가 발생했습니다.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={exporting}
            className={`px-4 py-2 rounded-lg text-white flex items-center ${
                exporting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
            }`}
        >
            {exporting ? (
                <>
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    내보내는 중...
                </>
            ) : (
                <>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    Excel로 내보내기
                </>
            )}
        </button>
    );
};

export default ExportButton;
