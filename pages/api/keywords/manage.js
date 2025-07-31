// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/pages/api/keywords/manage.js
import { updateNotionPage, queryAllNotionPages, getNotionDatabaseSchema } from "../../../lib/notion";

export default async function handler(req, res) {
    if (req.method === "POST") {
        console.warn("POST /api/keywords/manage: Notion API 페이지 생성 로직을 시작합니다.");
        try {
            // category_name은 이제 'R' 속성의 값 (R1, R2, R3 등)
            const { keyword_text, urls, priority, category_name } = req.body; 

            if (!keyword_text) {
                return res.status(400).json({ success: false, message: "키워드 텍스트는 필수입니다." });
            }
            // Notion API는 page.create를 사용하며, parent와 properties를 명시해야 합니다.
            // lib/notion.js에 createNotionPage 함수가 없으므로 먼저 추가해야 함.
            // 임시로 Notion API 클라이언트를 직접 사용하거나, lib/notion.js에 함수를 추가합니다.
            // 여기서는 lib/notion.js에 createNotionPage 함수가 있다고 가정합니다.
            
            // Notion API는 URL 속성에 단일 URL만 받으므로 배열의 첫 번째 요소만 사용
            const urlToNotion = urls && urls.length > 0 ? urls[0].url : null;
            
            // Notion page properties 정의
            const properties = {
                "키워드": {
                    "title": [{"text": {"content": keyword_text}}]
                },
                "기존글url": urlToNotion ? { "url": urlToNotion } : null,
                "우선순위": {
                    "select": { "name": String(priority) } // 우선순위는 Select 옵션으로 문자열이어야 함
                },
                "R": { // 'R' 속성에 카테고리 정보 저장 (Select 타입)
                    "select": { "name": category_name }
                },
                "상위 노출 여부": { "status": { "name": "미발행" } }, // 초기 상태
                "업데이트 날짜": { "date": { "start": new Date().toISOString().split('T')[0], "end": null } }
            };

            // lib/notion.js에 createNotionPage 함수를 추가해야 이 코드가 작동합니다.
            // export async function createNotionPage(properties) { ... }
            // 임시 방편으로, lib/notion에서 직접 Client를 사용하여 API 호출
            const notion = new (await import("../../../lib/notion")).Client({ auth: process.env.NOTION_API_KEY });
            const newPage = await notion.pages.create({
                parent: { database_id: process.env.NOTION_DATABASE_ID },
                properties: properties,
            });

            res.status(201).json({ success: true, data: { keyword_id: newPage.id, message: "키워드가 추가되었습니다." } });

        } catch (error) {
            console.error("Notion 키워드 추가 오류:", error);
            res.status(500).json({ success: false, message: "키워드 추가 실패", error: error.message });
        }

    } else if (req.method === "PUT") {
        try {
            const { keyword_id, keyword_text, priority, urls, is_active, category_name } = req.body; 

            if (!keyword_id) {
                return res.status(400).json({ success: false, message: "키워드 ID는 필수입니다." });
            }
            
            const propertiesToUpdate = {};

            if (keyword_text !== undefined) {
                propertiesToUpdate["키워드"] = {
                    "title": [{"text": {"content": keyword_text}}]
                };
            }
            if (priority !== undefined) {
                propertiesToUpdate["우선순위"] = {
                    "select": {"name": String(priority)}
                };
            }
            if (category_name !== undefined) {
                propertiesToUpdate["R"] = { // 'R' 속성 업데이트
                    "select": {"name": category_name}
                };
            }
            if (is_active !== undefined) {
                // Notion에 'isActive'와 같은 Checkbox 또는 Status 속성이 있다면 여기에 추가
                // 예: propertiesToUpdate["활성 여부"] = { "checkbox": is_active };
            }
            if (urls !== undefined) {
                propertiesToUpdate["기존글url"] = {
                    "url": urls && urls.length > 0 ? urls[0].url : null
                };
            }

            if (Object.keys(propertiesToUpdate).length === 0) {
                return res.status(400).json({ success: false, message: "업데이트할 필드가 없습니다." });
            }

            await updateNotionPage(keyword_id, propertiesToUpdate); // lib/notion 헬퍼 사용

            res.status(200).json({ success: true, message: "키워드가 수정되었습니다." });

        } catch (error) {
            console.error("Notion 키워드 수정 오류:", error);
            res.status(500).json({ success: false, message: "키워드 수정 실패", error: error.message });
        }

    } else if (req.method === "DELETE") {
        // DELETE 기능은 Notion API에서 페이지를 '보관(archive)'하는 방식으로 구현됩니다.
        // 이는 영구 삭제가 아니므로, 사용자에게 해당 사실을 알리거나 다른 방식으로 처리해야 합니다.
        console.warn("DELETE /api/keywords/manage: Notion API 페이지 삭제 로직을 시작합니다.");
        try {
            const { keyword_id } = req.body;
            if (!keyword_id) {
                return res.status(400).json({ success: false, message: "키워드 ID는 필수입니다." });
            }
            
            // Notion API를 사용하여 페이지를 '보관(archive)'합니다.
            const notion = new (await import("../../../lib/notion")).Client({ auth: process.env.NOTION_API_KEY });
            await notion.pages.update({
                page_id: keyword_id,
                archived: true, // 페이지를 보관 상태로 변경
            });

            res.status(200).json({ success: true, message: "키워드가 삭제되었습니다 (Notion에서 보관됨)." });
        } catch (error) {
            console.error("Notion 키워드 삭제 오류:", error);
            res.status(500).json({ success: false, message: "키워드 삭제 실패", error: error.message });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}