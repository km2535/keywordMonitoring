// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/pages/api/categories.js
import { getNotionDatabaseSchema } from "../../lib/notion";

// 이 함수는 'R' 속성의 각 옵션 ID에 대한 표시 이름을 정의합니다.
// 필요에 따라 'R1'을 '암' 등으로 매핑할 수 있습니다.
// 현재는 'R1' -> 'R1 키워드 그룹'과 같이 일반적인 이름을 사용합니다.
function getCategoryDisplayName(rValueId) {
    if (rValueId === "all") return "전체 키워드";
    return `${rValueId} 키워드 그룹`; // 기본값
}

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        console.log("Categories API called (Notion-based - dynamic 'R' values)");

        const schema = await getNotionDatabaseSchema();
        const rProperty = schema?.['R']; // 'R' 속성 정의 가져오기

        let categories = [
            { id: "all", name: "전체", display_name: "전체 키워드", description: "모든 키워드", is_active: true }
        ];

        if (rProperty && rProperty.type === "select" && rProperty.select?.options) {
            // 'R' 속성의 옵션들을 카테고리로 추가
            rProperty.select.options.forEach(option => {
                categories.push({
                    id: option.name, // R1, R2, R3 등이 id가 됨 (필터링에 사용)
                    name: option.name, // 내부 이름 (R1, R2 등)
                    display_name: getCategoryDisplayName(option.name), // UI에 표시될 이름 (R1 키워드 그룹 등)
                    description: `R 속성 값 ${option.name}에 해당하는 키워드`,
                    is_active: true,
                });
            });
            // 오름차순으로 정렬
            categories.sort((a, b) => {
                if (a.id === "all") return -1; // 'all'을 항상 맨 위로
                if (b.id === "all") return 1;
                return a.id.localeCompare(b.id);
            });
        } else {
            console.warn("Notion 데이터베이스에 'R' 속성이 없거나 'Select' 타입이 아닙니다. 기본 '전체' 카테고리만 제공합니다.");
        }

        console.log("Categories data provided:", categories.length, categories);

        res.status(200).json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error("Categories API error (Notion-based):", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch categories from Notion",
            error: error.message,
        });
    }
}