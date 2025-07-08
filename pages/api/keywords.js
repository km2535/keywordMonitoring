// pages/api/keywords.js - 안전한 버전
import { executeQuery, getPoolStatus } from "../../lib/database";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    let startTime = Date.now();
    
    try {
        const { category } = req.query;
        console.log("Keywords API called with category:", category);
        
        // 안전한 풀 상태 확인
        const poolStatus = getPoolStatus();
        console.log("Pool status:", poolStatus);

        let whereClause = "";
        let params = [];

        if (category && category !== "all") {
            whereClause = "WHERE c.name = ?";
            params.push(category);
        }

        // 단일 복합 쿼리로 모든 데이터를 한 번에 가져오기
        const complexQuery = `
            SELECT 
                k.id,
                k.keyword_text as keyword,
                k.category_id,
                c.name as category,
                c.display_name as category_display_name,
                k.priority,
                k.is_active,
                k.created_at,
                k.updated_at,
                -- URL 정보
                ku.id as url_id,
                ku.target_url as url,
                ku.url_type,
                ku.is_active as url_is_active,
                -- 최신 스캔 결과
                latest_scan.is_exposed,
                latest_scan.exposure_rank,
                latest_scan.response_code,
                latest_scan.scanned_at
            FROM keywords k
            JOIN categories c ON k.category_id = c.id
            LEFT JOIN keyword_urls ku ON k.id = ku.keyword_id AND ku.is_active = 1
            LEFT JOIN (
                SELECT 
                    usd.keyword_url_id,
                    usd.is_exposed,
                    usd.exposure_rank,
                    usd.response_code,
                    usd.scanned_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY usd.keyword_url_id 
                        ORDER BY usd.scanned_at DESC
                    ) as rn
                FROM url_scan_details usd
                JOIN scan_results sr ON usd.scan_result_id = sr.id
                JOIN scan_sessions ss ON sr.session_id = ss.id
                WHERE ss.scan_status = 'completed'
            ) latest_scan ON ku.id = latest_scan.keyword_url_id AND latest_scan.rn = 1
            ${whereClause}
            ORDER BY c.name, k.priority, k.keyword_text, ku.created_at
        `;

        console.log("Executing complex query...");
        const rawResults = await executeQuery(complexQuery, params);
        console.log(`Query completed in ${Date.now() - startTime}ms`);
        console.log("Raw results count:", rawResults.length);

        // 결과를 키워드별로 그룹화
        const keywordMap = new Map();
        
        rawResults.forEach(row => {
            const keywordId = row.id;
            
            if (!keywordMap.has(keywordId)) {
                keywordMap.set(keywordId, {
                    id: row.id,
                    keyword: row.keyword,
                    category: row.category,
                    categoryName: row.category_display_name,
                    priority: row.priority,
                    isActive: Boolean(row.is_active),
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    urls: []
                });
            }
            
            const keyword = keywordMap.get(keywordId);
            
            // URL이 있는 경우에만 추가
            if (row.url_id && row.url) {
                keyword.urls.push({
                    id: row.url_id,
                    url: row.url,
                    urlType: row.url_type,
                    isActive: Boolean(row.url_is_active),
                    isExposed: row.is_exposed === 1 ? true : row.is_exposed === 0 ? false : null,
                    exposureRank: row.exposure_rank,
                    responseCode: row.response_code,
                    scannedAt: row.scanned_at,
                });
            }
        });

        // Map을 배열로 변환하고 추가 정보 계산
        const processedKeywords = Array.from(keywordMap.values()).map(keyword => {
            const totalUrls = keyword.urls.length;
            const exposedUrls = keyword.urls.filter(url => url.isExposed === true).length;
            const hiddenUrls = keyword.urls.filter(url => url.isExposed === false).length;
            const unknownUrls = keyword.urls.filter(url => url.isExposed === null).length;

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
            const latestScanTime = keyword.urls.reduce((latest, url) => {
                if (url.scannedAt && (!latest || new Date(url.scannedAt) > new Date(latest))) {
                    return url.scannedAt;
                }
                return latest;
            }, null);

            return {
                ...keyword,
                totalUrls,
                exposedUrls,
                hiddenUrls,
                unknownUrls,
                exposureStatus,
                exposureRate: totalUrls > 0 ? Math.round((exposedUrls / totalUrls) * 100) : 0,
                hasExposedUrl: exposedUrls > 0,
                scannedAt: latestScanTime,
            };
        });

        console.log("Final processed keywords:", processedKeywords.length);
        console.log(`Total execution time: ${Date.now() - startTime}ms`);

        res.status(200).json({
            success: true,
            data: processedKeywords,
            timestamp: new Date().toISOString(),
            executionTime: Date.now() - startTime,
            poolStatus: getPoolStatus() // 최종 풀 상태 포함
        });

    } catch (error) {
        console.error("Keywords API error:", error);
        const finalPoolStatus = getPoolStatus();
        console.log("Pool status on error:", finalPoolStatus);
        
        res.status(500).json({
            success: false,
            message: "Failed to fetch keywords",
            error: error.message,
            executionTime: Date.now() - startTime,
            poolStatus: finalPoolStatus
        });
    }
}