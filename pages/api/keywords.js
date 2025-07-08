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

        // 키워드 목록 가져오기
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
        console.log("Sample keyword:", keywords[0]);

        // 각 키워드에 대해 URL 정보 가져오기
        const keywordsWithUrls = await Promise.all(
            keywords.map(async (keyword) => {
                try {
                    // 해당 키워드의 URL 정보 가져오기
                    const urlsQuery = `
            SELECT 
              ku.id,
              ku.target_url as url,
              ku.url_type,
              ku.is_active,
              COALESCE(latest_scan.is_exposed, NULL) as is_exposed,
              latest_scan.exposure_rank,
              latest_scan.scanned_at
            FROM keyword_urls ku
            LEFT JOIN (
              SELECT 
                usd.keyword_url_id,
                usd.is_exposed,
                usd.exposure_rank,
                usd.scanned_at,
                ROW_NUMBER() OVER (PARTITION BY usd.keyword_url_id ORDER BY usd.scanned_at DESC) as rn
              FROM url_scan_details usd
              JOIN scan_results sr ON usd.scan_result_id = sr.id
              JOIN scan_sessions ss ON sr.session_id = ss.id
              WHERE ss.scan_status = 'completed'
            ) latest_scan ON ku.id = latest_scan.keyword_url_id AND latest_scan.rn = 1
            WHERE ku.keyword_id = ? AND ku.is_active = TRUE
            ORDER BY ku.created_at
          `;

                    const urls = await executeQuery(urlsQuery, [keyword.id]);

                    // 노출 상태 결정
                    const totalUrls = urls.length;
                    const exposedUrls = urls.filter(
                        (url) => url.is_exposed === true
                    ).length;
                    const hiddenUrls = urls.filter(
                        (url) => url.is_exposed === false
                    ).length;

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
                        exposureStatus: exposureStatus,
                        exposureRate:
                            totalUrls > 0
                                ? Math.round((exposedUrls / totalUrls) * 100)
                                : 0,
                        hasExposedUrl: exposedUrls > 0,
                        scannedAt: urls.length > 0 ? urls[0].scanned_at : null,
                        createdAt: keyword.created_at,
                        updatedAt: keyword.updated_at,
                        urls: urls.map((url) => ({
                            id: url.id,
                            url: url.url,
                            urlType: url.url_type,
                            isActive: Boolean(url.is_active),
                            isExposed: url.is_exposed,
                            exposureRank: url.exposure_rank,
                            scannedAt: url.scanned_at,
                        })),
                    };
                } catch (error) {
                    console.error(
                        `Error processing keyword ${keyword.id}:`,
                        error
                    );
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
        });
    }
}
