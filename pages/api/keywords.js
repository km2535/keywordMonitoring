// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/pages/api/keywords.js
import { queryAllNotionPages } from "../../lib/notion";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    let startTime = Date.now();
    
    try {
        const { category } = req.query; // 클라이언트에서 요청한 카테고리 (all, R1, R2 등)
        console.log("Keywords API called with category:", category);
        
        const rawNotionPages = await queryAllNotionPages();
        
        const processedKeywords = [];

        rawNotionPages.forEach(page => {
            const properties = page.properties;
            const pageId = page.id;

            const keywordText = properties?.['키워드']?.title?.[0]?.plain_text || '';
            const originalUrlText = properties?.['기존글url']?.url || '';
            const writtenUrlText = properties?.['작성 글 URL']?.url || ''; // 새로 추가된 속성
            const exposureStatusNotion = properties?.['상위 노출 여부']?.status?.name || '미확인';
            const priority = properties?.['우선순위']?.select?.name || 'N/A';
            const updatedAt = properties?.['업데이트 날짜']?.date?.start || null;
            
            // 'R' 속성 값을 카테고리로 사용
            const rValue = properties?.['R']?.select?.name || 'N/A'; // 'R1', R2', 'R3' 등의 값
            const categoryNameForUI = rValue; // 'R' 속성 값을 categoryName으로 사용
            const urlsData = [];

            let isExposedInUrl = null;
            if (exposureStatusNotion === "최상단 노출") {
                isExposedInUrl = true;
            } else if (exposureStatusNotion === "노출X" || exposureStatusNotion === "저품질") {
                isExposedInUrl = false;
            }
            
            // 기존글 URL과 작성글 URL을 구분하여 추가
            if (originalUrlText) {
                // 콤마로 구분된 URL 문자열을 배열로 분리
                const originalUrls = originalUrlText.split(',').map(url => url.trim()).filter(url => url);
                originalUrls.forEach(url => {
                    urlsData.push({
                        url: url,
                        urlType: '기존글',
                        isExposed: isExposedInUrl,
                        exposureRank: null,
                        responseCode: null,
                        scannedAt: updatedAt,
                    });
                });
            }

            if (writtenUrlText) {
                // 콤마로 구분된 URL 문자열을 배열로 분리
                const writtenUrls = writtenUrlText.split(',').map(url => url.trim()).filter(url => url);
                writtenUrls.forEach(url => {
                    urlsData.push({
                        url: url,
                        urlType: '작성글',
                        isExposed: isExposedInUrl,
                        exposureRank: null,
                        responseCode: null,
                        scannedAt: updatedAt,
                    });
                });
            }

            // 요청된 category가 'all'이 아니면서 현재 키워드의 'R' 값이 요청된 category와 다르면 건너뜁니다.
            if (category !== 'all' && categoryNameForUI !== category) {
                return; // 현재 키워드를 결과에 포함하지 않음
            }

            processedKeywords.push({
                id: pageId,
                keyword: keywordText,
                category: categoryNameForUI, // 'R' 값
                categoryName: categoryNameForUI, // 'R' 값 (UI 표시용)
                priority: parseInt(priority) || 1,
                createdAt: page.created_time,
                updatedAt: updatedAt,

                totalUrls: urlsData.length,
                exposedUrls: urlsData.filter(u => u.isExposed === true).length,
                hiddenUrls: urlsData.filter(u => u.isExposed === false).length,
                unknownUrls: urlsData.filter(u => u.isExposed === null).length,
                exposureStatus: exposureStatusNotion,
                exposureRate: urlsData.length > 0 ? Math.round((urlsData.filter(u => u.isExposed === true).length / urlsData.length) * 100) : 0,
                hasExposedUrl: urlsData.some(u => u.isExposed === true),
                scannedAt: updatedAt,
                urls: urlsData,
            });
        });

        console.log("Processed keywords for UI:", processedKeywords.length);
        console.log(`Total execution time: ${Date.now() - startTime}ms`);

        res.status(200).json({
            success: true,
            data: processedKeywords,
            timestamp: new Date().toISOString(),
            executionTime: Date.now() - startTime,
        });

    } catch (error) {
        console.error("Keywords API error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch keywords from Notion",
            error: error.message,
            executionTime: Date.now() - startTime,
        });
    }
}