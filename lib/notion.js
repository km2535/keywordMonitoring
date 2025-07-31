// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/lib/notion.js
import { Client } from "@notionhq/client";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_API_KEY) {
    console.error("환경 변수 NOTION_API_KEY가 설정되지 않았습니다.");
    // 개발 환경에서만 오류를 throw하고, 프로덕션에서는 안전하게 처리
    if (process.env.NODE_ENV === 'development') {
        throw new Error("NOTION_API_KEY is not set in environment variables.");
    }
}
if (!NOTION_DATABASE_ID) {
    console.error("환경 변수 NOTION_DATABASE_ID가 설정되지 않았습니다.");
    if (process.env.NODE_ENV === 'development') {
        throw new Error("NOTION_DATABASE_ID is not set in environment variables.");
    }
}

const notion = new Client({ auth: NOTION_API_KEY });

/**
 * 노션 데이터베이스의 모든 페이지(항목)를 쿼리합니다.
 * @returns {Promise<Array>} 페이지 객체 배열
 */
export async function queryAllNotionPages() {
    if (!notion || !NOTION_DATABASE_ID) {
        console.warn("Notion 클라이언트 또는 데이터베이스 ID가 설정되지 않아 페이지를 쿼리할 수 없습니다.");
        return [];
    }

    let allPages = [];
    let cursor = undefined;
    let hasMore = true;

    console.log("Notion API: 데이터베이스의 모든 페이지를 쿼리 중...");

    while (hasMore) {
        try {
            const response = await notion.databases.query({
                database_id: NOTION_DATABASE_ID,
                start_cursor: cursor,
                page_size: 100, // 최대 페이지 크기
            });

            allPages = allPages.concat(response.results);
            hasMore = response.has_more;
            cursor = response.next_cursor;
        } catch (error) {
            console.error("Notion API: 페이지 쿼리 실패:", error.message);
            // API 오류 발생 시 루프 중단 및 현재까지의 페이지 반환
            hasMore = false;
            // 필요에 따라 에러를 다시 throw하거나, 특정 오류 처리 로직 추가
            // throw error; 
        }
    }
    console.log(`Notion API: 총 ${allPages.length}개의 페이지를 성공적으로 가져왔습니다.`);
    return allPages;
}

/**
 * 노션 페이지의 속성을 업데이트합니다.
 * @param {string} pageId 업데이트할 페이지 ID
 * @param {Object} properties 업데이트할 속성 객체
 * @returns {Promise<Object>} 업데이트된 페이지 객체
 */
export async function updateNotionPage(pageId, properties) {
    if (!notion) {
        console.warn("Notion 클라이언트가 설정되지 않아 페이지를 업데이트할 수 없습니다.");
        return null;
    }
    console.log(`Notion API: 페이지 ID ${pageId} 업데이트 중...`);
    try {
        const response = await notion.pages.update({
            page_id: pageId,
            properties: properties,
        });
        console.log(`Notion API: 페이지 ${pageId}가 성공적으로 업데이트되었습니다.`);
        return response;
    } catch (error) {
        console.error(`Notion API: 페이지 ${pageId} 업데이트 실패:`, error.message);
        // 오류 상세 로깅
        if (error.body) {
            console.error("Notion API Response Error Body:", JSON.parse(error.body));
        }
        throw error; // 에러를 다시 throw하여 호출자에게 알림
    }
}

/**
 * 노션 데이터베이스 스키마(속성 정의)를 가져옵니다.
 * @returns {Promise<Object>} 데이터베이스 스키마 속성 객체
 */
export async function getNotionDatabaseSchema() {
    if (!notion || !NOTION_DATABASE_ID) {
        console.warn("Notion 클라이언트 또는 데이터베이스 ID가 설정되지 않아 스키마를 가져올 수 없습니다.");
        return {};
    }
    console.log("Notion API: 데이터베이스 스키마 가져오는 중...");
    try {
        const response = await notion.databases.retrieve({
            database_id: NOTION_DATABASE_ID,
        });
        console.log("Notion API: 데이터베이스 스키마 성공적으로 가져왔습니다.");
        return response.properties;
    } catch (error) {
        console.error("Notion API: 데이터베이스 스키마 가져오기 실패:", error.message);
        throw error;
    }
}

// TODO: 필요하다면 createNotionPage, deleteNotionPage 등 추가 (keywords/manage.js에서 사용할 예정)