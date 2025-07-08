import { executeQuery } from "../../lib/database";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { category } = req.query;
        console.log("Keywords API called with category:", category);

        let whereClause = "";
        let params = [];

        if (category && category !== "all") {
            // 카테고리 필터링 - name으로 필터링
            whereClause = "WHERE c.name = ?";
            params.push(category);
        }

        // 키워드 목록 가져오기 - 보다 안정적인 쿼리 사용
        const keywordsQuery = `
            SELECT 
                k.id,
                k.keyword_text as keyword,
                k.category_id,
                c.name as category,
                c.display_name as category_display_name,
                k.priority,
                k.is_active,
                k.created_at,
                k.updated_at
            FROM keywords k
            JOIN categories c ON k.category_id = c.id
            ${whereClause}
            ORDER BY c.name, k.priority, k.keyword_text
        `;

        console.log("Executing keywords query:", keywordsQuery);
        console.log("With params:", params);

        const keywords = await executeQuery(keywordsQuery, params);
        console.log("Keywords found:", keywords.length);

        // 각 키워드에 대해 URL 정보 가져오기
        const keywordsWithUrls = await Promise.all(
            keywords.map(async (keyword) => {
                try {
                    // 해당 키워드의 URL 정보와 최신 스캔 결과 가져오기
                    const urlsQuery = `
                        SELECT 
                            ku.id,
                            ku.target_url as url,
                            ku.url_type,
                            ku.is_active,
                            usd.is_exposed,
                            usd.exposure_rank,
                            usd.response_code,
                            usd.scanned_at
                        FROM keyword_urls ku
                        LEFT JOIN (
                            SELECT 
                                usd.*,
                                ROW_NUMBER() OVER (
                                    PARTITION BY usd.keyword_url_id 
                                    ORDER BY usd.scanned_at DESC
                                ) as rn
                            FROM url_scan_details usd
                            JOIN scan_results sr ON usd.scan_result_id = sr.id
                            JOIN scan_sessions ss ON sr.session_id = ss.id
                            WHERE ss.scan_status = 'completed'
                        ) usd ON ku.id = usd.keyword_url_id AND usd.rn = 1
                        WHERE ku.keyword_id = ? AND ku.is_active = 1
                        ORDER BY ku.created_at
                    `;

                    const urls = await executeQuery(urlsQuery, [keyword.id]);

                    // 노출 상태 결정
                    const totalUrls = urls.length;
                    const exposedUrls = urls.filter(url => url.is_exposed === 1).length;
                    const hiddenUrls = urls.filter(url => url.is_exposed === 0).length;
                    const unknownUrls = urls.filter(url => url.is_exposed === null).length;

                    let exposureStatus;
                    if (totalUrls === 0) {
                        exposureStatus = "URL 없음";
                    } else if (exposedUrls > 0) {
                        exposureStatus = "노출됨";
                    } else if (hiddenUrls > 0) {
                        exposureStatus = "노출 안됨";
                    } else {
                        exposureStatus = "미확인";
                    }

                    // 최신 스캔 시간 찾기
                    const latestScanTime = urls.reduce((latest, url) => {
                        if (url.scanned_at && (!latest || new Date(url.scanned_at) > new Date(latest))) {
                            return url.scanned_at;
                        }
                        return latest;
                    }, null);

                    return {
                        id: keyword.id,
                        keyword: keyword.keyword,
                        category: keyword.category,
                        categoryName: keyword.category_display_name,
                        priority: keyword.priority,
                        isActive: Boolean(keyword.is_active),
                        totalUrls: totalUrls,
                        exposedUrls: exposedUrls,
                        hiddenUrls: hiddenUrls,
                        unknownUrls: unknownUrls,
                        exposureStatus: exposureStatus,
                        exposureRate: totalUrls > 0 ? Math.round((exposedUrls / totalUrls) * 100) : 0,
                        hasExposedUrl: exposedUrls > 0,
                        scannedAt: latestScanTime,
                        createdAt: keyword.created_at,
                        updatedAt: keyword.updated_at,
                        urls: urls.map((url) => ({
                            id: url.id,
                            url: url.url,
                            urlType: url.url_type,
                            isActive: Boolean(url.is_active),
                            isExposed: url.is_exposed === 1 ? true : url.is_exposed === 0 ? false : null,
                            exposureRank: url.exposure_rank,
                            responseCode: url.response_code,
                            scannedAt: url.scanned_at,
                        })),
                    };
                } catch (error) {
                    console.error(`Error processing keyword ${keyword.id}:`, error);
                    return {
                        id: keyword.id,
                        keyword: keyword.keyword,
                        category: keyword.category,
                        categoryName: keyword.category_display_name,
                        priority: keyword.priority,
                        isActive: Boolean(keyword.is_active),
                        totalUrls: 0,
                        exposedUrls: 0,
                        hiddenUrls: 0,
                        unknownUrls: 0,
                        exposureStatus: "URL 없음",
                        exposureRate: 0,
                        hasExposedUrl: false,
                        scannedAt: null,
                        createdAt: keyword.created_at,
                        updatedAt: keyword.updated_at,
                        urls: [],
                    };
                }
            })
        );

        console.log("Final processed keywords:", keywordsWithUrls.length);
        console.log("Sample keyword data:", keywordsWithUrls[0]);

        res.status(200).json({
            success: true,
            data: keywordsWithUrls,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Keywords API error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch keywords",
            error: error.message,
            stack: error.stack,
        });
    }
}