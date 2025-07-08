import { executeQuery } from "../../lib/database";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { category } = req.query;
        
        console.log("Statistics API called with category:", category);

        let whereClause = "";
        let params = [];

        if (category && category !== "all") {
            whereClause = "WHERE lsr.category_name = ?";
            params.push(category);
        }

        // 먼저 뷰가 존재하는지 확인하고, 없으면 직접 쿼리 사용
        let statisticsQuery;
        
        try {
            // 뷰를 사용한 쿼리 시도
            if (category === "all" || !category) {
                statisticsQuery = `
                    SELECT 
                        'all' as category_name,
                        '전체' as category_display_name,
                        COALESCE(SUM(lsr.total_urls_scanned), 0) as total_urls,
                        COALESCE(SUM(lsr.exposed_urls_count), 0) as exposed_urls,
                        COALESCE(SUM(lsr.hidden_urls_count), 0) as hidden_urls,
                        COALESCE(SUM(lsr.error_urls_count), 0) as error_urls,
                        COUNT(DISTINCT lsr.keyword_id) as total_keywords,
                        COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned > 0 THEN lsr.keyword_id END) as keywords_with_urls,
                        COUNT(DISTINCT CASE WHEN lsr.exposed_urls_count > 0 THEN lsr.keyword_id END) as exposed_keywords,
                        COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned > 0 AND lsr.exposed_urls_count = 0 THEN lsr.keyword_id END) as not_exposed_keywords,
                        COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned = 0 THEN lsr.keyword_id END) as no_url_keywords,
                        COALESCE(AVG(lsr.exposure_rate_percent), 0) as avg_exposure_rate,
                        MAX(lsr.scanned_at) as last_scan_time
                    FROM v_latest_scan_results lsr
                    ${whereClause}
                `;
            } else {
                statisticsQuery = `
                    SELECT 
                        lsr.category_name,
                        lsr.category_display_name,
                        COALESCE(SUM(lsr.total_urls_scanned), 0) as total_urls,
                        COALESCE(SUM(lsr.exposed_urls_count), 0) as exposed_urls,
                        COALESCE(SUM(lsr.hidden_urls_count), 0) as hidden_urls,
                        COALESCE(SUM(lsr.error_urls_count), 0) as error_urls,
                        COUNT(DISTINCT lsr.keyword_id) as total_keywords,
                        COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned > 0 THEN lsr.keyword_id END) as keywords_with_urls,
                        COUNT(DISTINCT CASE WHEN lsr.exposed_urls_count > 0 THEN lsr.keyword_id END) as exposed_keywords,
                        COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned > 0 AND lsr.exposed_urls_count = 0 THEN lsr.keyword_id END) as not_exposed_keywords,
                        COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned = 0 THEN lsr.keyword_id END) as no_url_keywords,
                        COALESCE(AVG(lsr.exposure_rate_percent), 0) as avg_exposure_rate,
                        MAX(lsr.scanned_at) as last_scan_time
                    FROM v_latest_scan_results lsr
                    ${whereClause}
                    GROUP BY lsr.category_name, lsr.category_display_name
                `;
            }
            
            const stats = await executeQuery(statisticsQuery, params);
            console.log("Stats from view:", stats);
            
        } catch (viewError) {
            console.log("View query failed, falling back to direct query:", viewError.message);
            
            // 뷰가 없으면 직접 쿼리 사용
            if (category === "all" || !category) {
                statisticsQuery = `
                    SELECT 
                        'all' as category_name,
                        '전체' as category_display_name,
                        COALESCE(SUM(sr.total_urls_scanned), 0) as total_urls,
                        COALESCE(SUM(sr.exposed_urls_count), 0) as exposed_urls,
                        COALESCE(SUM(sr.hidden_urls_count), 0) as hidden_urls,
                        COALESCE(SUM(sr.error_urls_count), 0) as error_urls,
                        COUNT(DISTINCT k.id) as total_keywords,
                        COUNT(DISTINCT CASE WHEN sr.total_urls_scanned > 0 THEN k.id END) as keywords_with_urls,
                        COUNT(DISTINCT CASE WHEN sr.exposed_urls_count > 0 THEN k.id END) as exposed_keywords,
                        COUNT(DISTINCT CASE WHEN sr.total_urls_scanned > 0 AND sr.exposed_urls_count = 0 THEN k.id END) as not_exposed_keywords,
                        COUNT(DISTINCT CASE WHEN ku.id IS NULL THEN k.id END) as no_url_keywords,
                        COALESCE(AVG(CASE WHEN sr.total_urls_scanned > 0 THEN (sr.exposed_urls_count * 100.0 / sr.total_urls_scanned) END), 0) as avg_exposure_rate,
                        MAX(sr.scanned_at) as last_scan_time
                    FROM keywords k
                    JOIN categories c ON k.category_id = c.id
                    LEFT JOIN keyword_urls ku ON k.id = ku.keyword_id AND ku.is_active = 1
                    LEFT JOIN (
                        SELECT 
                            sr.*,
                            ROW_NUMBER() OVER (PARTITION BY sr.keyword_id ORDER BY sr.scanned_at DESC) as rn
                        FROM scan_results sr
                        JOIN scan_sessions ss ON sr.session_id = ss.id
                        WHERE ss.scan_status = 'completed'
                    ) sr ON k.id = sr.keyword_id AND sr.rn = 1
                    WHERE k.is_active = 1 AND c.is_active = 1
                    ${category && category !== "all" ? "AND c.name = ?" : ""}
                `;
            } else {
                statisticsQuery = `
                    SELECT 
                        c.name as category_name,
                        c.display_name as category_display_name,
                        COALESCE(SUM(sr.total_urls_scanned), 0) as total_urls,
                        COALESCE(SUM(sr.exposed_urls_count), 0) as exposed_urls,
                        COALESCE(SUM(sr.hidden_urls_count), 0) as hidden_urls,
                        COALESCE(SUM(sr.error_urls_count), 0) as error_urls,
                        COUNT(DISTINCT k.id) as total_keywords,
                        COUNT(DISTINCT CASE WHEN sr.total_urls_scanned > 0 THEN k.id END) as keywords_with_urls,
                        COUNT(DISTINCT CASE WHEN sr.exposed_urls_count > 0 THEN k.id END) as exposed_keywords,
                        COUNT(DISTINCT CASE WHEN sr.total_urls_scanned > 0 AND sr.exposed_urls_count = 0 THEN k.id END) as not_exposed_keywords,
                        COUNT(DISTINCT CASE WHEN ku.id IS NULL THEN k.id END) as no_url_keywords,
                        COALESCE(AVG(CASE WHEN sr.total_urls_scanned > 0 THEN (sr.exposed_urls_count * 100.0 / sr.total_urls_scanned) END), 0) as avg_exposure_rate,
                        MAX(sr.scanned_at) as last_scan_time
                    FROM categories c
                    JOIN keywords k ON c.id = k.category_id
                    LEFT JOIN keyword_urls ku ON k.id = ku.keyword_id AND ku.is_active = 1
                    LEFT JOIN (
                        SELECT 
                            sr.*,
                            ROW_NUMBER() OVER (PARTITION BY sr.keyword_id ORDER BY sr.scanned_at DESC) as rn
                        FROM scan_results sr
                        JOIN scan_sessions ss ON sr.session_id = ss.id
                        WHERE ss.scan_status = 'completed'
                    ) sr ON k.id = sr.keyword_id AND sr.rn = 1
                    WHERE k.is_active = 1 AND c.is_active = 1 AND c.name = ?
                    GROUP BY c.name, c.display_name
                `;
            }
            
            const stats = await executeQuery(statisticsQuery, params);
            console.log("Stats from direct query:", stats);
        }

        const stats = await executeQuery(statisticsQuery, params);
        
        // 기본값 설정
        const stat = stats[0] || {
            total_keywords: 0,
            keywords_with_urls: 0,
            exposed_keywords: 0,
            not_exposed_keywords: 0,
            no_url_keywords: 0,
            total_urls: 0,
            exposed_urls: 0,
            hidden_urls: 0,
            error_urls: 0,
            avg_exposure_rate: 0,
        };

        console.log("Final stat object:", stat);

        // Calculate success rate
        const exposureSuccessRate =
            stat.keywords_with_urls > 0
                ? Math.round(
                      (stat.exposed_keywords / stat.keywords_with_urls) * 100
                  )
                : 0;

        // Prepare chart data
        const exposureStatsData = [
            { name: "노출됨", value: parseInt(stat.exposed_keywords) || 0 },
            { name: "노출 안됨", value: parseInt(stat.not_exposed_keywords) || 0 },
            { name: "URL 없음", value: parseInt(stat.no_url_keywords) || 0 },
        ];

        const summary = {
            totalKeywords: parseInt(stat.total_keywords) || 0,
            keywordsWithUrls: parseInt(stat.keywords_with_urls) || 0,
            exposedKeywords: parseInt(stat.exposed_keywords) || 0,
            notExposedKeywords: parseInt(stat.not_exposed_keywords) || 0,
            noUrlKeywords: parseInt(stat.no_url_keywords) || 0,
            totalUrls: parseInt(stat.total_urls) || 0,
            exposedUrls: parseInt(stat.exposed_urls) || 0,
            hiddenUrls: parseInt(stat.hidden_urls) || 0,
            errorUrls: parseInt(stat.error_urls) || 0,
            exposureSuccessRate,
            averageExposureRate: Math.round(parseFloat(stat.avg_exposure_rate) || 0),
            lastScanTime: stat.last_scan_time,
            exposureStatsData,
        };

        console.log("Final summary:", summary);

        // If requesting all categories, also get individual category stats
        let categoryData = {};
        if (category === "all" || !category) {
            try {
                // 먼저 뷰를 사용해보고, 실패하면 직접 쿼리 사용
                let categoryStatsQuery;
                try {
                    categoryStatsQuery = `
                        SELECT 
                            lsr.category_name,
                            lsr.category_display_name,
                            COALESCE(SUM(lsr.total_urls_scanned), 0) as total_urls,
                            COALESCE(SUM(lsr.exposed_urls_count), 0) as exposed_urls,
                            COALESCE(SUM(lsr.hidden_urls_count), 0) as hidden_urls,
                            COALESCE(SUM(lsr.error_urls_count), 0) as error_urls,
                            COUNT(DISTINCT lsr.keyword_id) as total_keywords,
                            COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned > 0 THEN lsr.keyword_id END) as keywords_with_urls,
                            COUNT(DISTINCT CASE WHEN lsr.exposed_urls_count > 0 THEN lsr.keyword_id END) as exposed_keywords,
                            COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned > 0 AND lsr.exposed_urls_count = 0 THEN lsr.keyword_id END) as not_exposed_keywords,
                            COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned = 0 THEN lsr.keyword_id END) as no_url_keywords,
                            COALESCE(AVG(lsr.exposure_rate_percent), 0) as avg_exposure_rate,
                            MAX(lsr.scanned_at) as last_scan_time
                        FROM v_latest_scan_results lsr
                        GROUP BY lsr.category_name, lsr.category_display_name
                        ORDER BY lsr.category_name
                    `;
                    const categoryStats = await executeQuery(categoryStatsQuery);
                    console.log("Category stats from view:", categoryStats);
                } catch (viewError) {
                    console.log("Category view query failed, using direct query");
                    categoryStatsQuery = `
                        SELECT 
                            c.name as category_name,
                            c.display_name as category_display_name,
                            COALESCE(SUM(sr.total_urls_scanned), 0) as total_urls,
                            COALESCE(SUM(sr.exposed_urls_count), 0) as exposed_urls,
                            COALESCE(SUM(sr.hidden_urls_count), 0) as hidden_urls,
                            COALESCE(SUM(sr.error_urls_count), 0) as error_urls,
                            COUNT(DISTINCT k.id) as total_keywords,
                            COUNT(DISTINCT CASE WHEN sr.total_urls_scanned > 0 THEN k.id END) as keywords_with_urls,
                            COUNT(DISTINCT CASE WHEN sr.exposed_urls_count > 0 THEN k.id END) as exposed_keywords,
                            COUNT(DISTINCT CASE WHEN sr.total_urls_scanned > 0 AND sr.exposed_urls_count = 0 THEN k.id END) as not_exposed_keywords,
                            COUNT(DISTINCT CASE WHEN ku.id IS NULL THEN k.id END) as no_url_keywords,
                            COALESCE(AVG(CASE WHEN sr.total_urls_scanned > 0 THEN (sr.exposed_urls_count * 100.0 / sr.total_urls_scanned) END), 0) as avg_exposure_rate,
                            MAX(sr.scanned_at) as last_scan_time
                        FROM categories c
                        JOIN keywords k ON c.id = k.category_id
                        LEFT JOIN keyword_urls ku ON k.id = ku.keyword_id AND ku.is_active = 1
                        LEFT JOIN (
                            SELECT 
                                sr.*,
                                ROW_NUMBER() OVER (PARTITION BY sr.keyword_id ORDER BY sr.scanned_at DESC) as rn
                            FROM scan_results sr
                            JOIN scan_sessions ss ON sr.session_id = ss.id
                            WHERE ss.scan_status = 'completed'
                        ) sr ON k.id = sr.keyword_id AND sr.rn = 1
                        WHERE k.is_active = 1 AND c.is_active = 1
                        GROUP BY c.name, c.display_name
                        ORDER BY c.name
                    `;
                }

                const categoryStats = await executeQuery(categoryStatsQuery);
                console.log("Category stats:", categoryStats);

                categoryStats.forEach((catStat) => {
                    const catSuccessRate =
                        catStat.keywords_with_urls > 0
                            ? Math.round(
                                  (catStat.exposed_keywords /
                                      catStat.keywords_with_urls) *
                                      100
                              )
                            : 0;

                    categoryData[catStat.category_name] = {
                        summary: {
                            totalKeywords: parseInt(catStat.total_keywords) || 0,
                            keywordsWithUrls: parseInt(catStat.keywords_with_urls) || 0,
                            exposedKeywords: parseInt(catStat.exposed_keywords) || 0,
                            notExposedKeywords: parseInt(catStat.not_exposed_keywords) || 0,
                            noUrlKeywords: parseInt(catStat.no_url_keywords) || 0,
                            totalUrls: parseInt(catStat.total_urls) || 0,
                            exposedUrls: parseInt(catStat.exposed_urls) || 0,
                            hiddenUrls: parseInt(catStat.hidden_urls) || 0,
                            errorUrls: parseInt(catStat.error_urls) || 0,
                            exposureSuccessRate: catSuccessRate,
                            averageExposureRate: Math.round(
                                parseFloat(catStat.avg_exposure_rate) || 0
                            ),
                            lastScanTime: catStat.last_scan_time,
                            exposureStatsData: [
                                {
                                    name: "노출됨",
                                    value: parseInt(catStat.exposed_keywords) || 0,
                                },
                                {
                                    name: "노출 안됨",
                                    value: parseInt(catStat.not_exposed_keywords) || 0,
                                },
                                {
                                    name: "URL 없음",
                                    value: parseInt(catStat.no_url_keywords) || 0,
                                },
                            ],
                        },
                    };
                });
            } catch (categoryError) {
                console.error("Error fetching category stats:", categoryError);
            }
        }

        const response = {
            success: true,
            data: {
                summary,
                categoryData,
                allSummary: summary,
                timestamp: new Date().toISOString(),
            },
        };

        console.log("Final API response:", JSON.stringify(response, null, 2));
        res.status(200).json(response);
        
    } catch (error) {
        console.error("Statistics API error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch statistics",
            error: error.message,
            stack: error.stack,
        });
    }
}