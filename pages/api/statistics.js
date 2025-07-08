// pages/api/statistics.js - 최적화된 버전
import { executeQuery, getPoolStatus } from "../../lib/database";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    let startTime = Date.now();
    
    try {
        const { category } = req.query;
        console.log("Statistics API called with category:", category);
        console.log("Pool status before:", getPoolStatus());

        // 단일 복합 쿼리로 모든 통계를 한 번에 계산
        const statsQuery = `
            WITH latest_scan_results AS (
                SELECT 
                    k.id as keyword_id,
                    c.name as category_name,
                    c.display_name as category_display_name,
                    COUNT(ku.id) as total_urls_scanned,
                    COALESCE(SUM(CASE WHEN usd.is_exposed = 1 THEN 1 ELSE 0 END), 0) as exposed_urls_count,
                    COALESCE(SUM(CASE WHEN usd.is_exposed = 0 THEN 1 ELSE 0 END), 0) as hidden_urls_count,
                    COALESCE(SUM(CASE WHEN usd.is_exposed IS NULL THEN 1 ELSE 0 END), 0) as error_urls_count,
                    CASE 
                        WHEN COUNT(ku.id) = 0 THEN 0
                        ELSE ROUND((SUM(CASE WHEN usd.is_exposed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(ku.id)), 2)
                    END as exposure_rate_percent,
                    MAX(usd.scanned_at) as scanned_at
                FROM keywords k
                JOIN categories c ON k.category_id = c.id
                LEFT JOIN keyword_urls ku ON k.id = ku.keyword_id AND ku.is_active = 1
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
                WHERE k.is_active = 1 AND c.is_active = 1
                ${category && category !== "all" ? "AND c.name = ?" : ""}
                GROUP BY k.id, c.name, c.display_name
            ),
            aggregated_stats AS (
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
                FROM latest_scan_results lsr
                GROUP BY lsr.category_name, lsr.category_display_name
            )
            SELECT 
                ${category === "all" || !category ? "'all'" : "category_name"} as category_name,
                ${category === "all" || !category ? "'전체'" : "category_display_name"} as category_display_name,
                SUM(total_urls) as total_urls,
                SUM(exposed_urls) as exposed_urls,
                SUM(hidden_urls) as hidden_urls,
                SUM(error_urls) as error_urls,
                SUM(total_keywords) as total_keywords,
                SUM(keywords_with_urls) as keywords_with_urls,
                SUM(exposed_keywords) as exposed_keywords,
                SUM(not_exposed_keywords) as not_exposed_keywords,
                SUM(no_url_keywords) as no_url_keywords,
                AVG(avg_exposure_rate) as avg_exposure_rate,
                MAX(last_scan_time) as last_scan_time
            FROM aggregated_stats
            ${category === "all" || !category ? "" : "WHERE category_name = ?"}
            ${category === "all" || !category ? "" : "GROUP BY category_name, category_display_name"}
        `;

        const params = [];
        if (category && category !== "all") {
            params.push(category);
            if (category !== "all") {
                params.push(category);
            }
        }

        console.log("Executing optimized statistics query...");
        const stats = await executeQuery(statsQuery, params);
        console.log(`Statistics query completed in ${Date.now() - startTime}ms`);

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

        const exposureSuccessRate = stat.keywords_with_urls > 0
            ? Math.round((stat.exposed_keywords / stat.keywords_with_urls) * 100)
            : 0;

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

        // 카테고리별 데이터는 요청시에만 가져오기
        let categoryData = {};
        if (category === "all" || !category) {
            try {
                const categoryStatsQuery = `
                    WITH latest_scan_results AS (
                        SELECT 
                            k.id as keyword_id,
                            c.name as category_name,
                            c.display_name as category_display_name,
                            COUNT(ku.id) as total_urls_scanned,
                            COALESCE(SUM(CASE WHEN usd.is_exposed = 1 THEN 1 ELSE 0 END), 0) as exposed_urls_count,
                            COALESCE(SUM(CASE WHEN usd.is_exposed = 0 THEN 1 ELSE 0 END), 0) as hidden_urls_count,
                            COALESCE(SUM(CASE WHEN usd.is_exposed IS NULL THEN 1 ELSE 0 END), 0) as error_urls_count,
                            CASE 
                                WHEN COUNT(ku.id) = 0 THEN 0
                                ELSE ROUND((SUM(CASE WHEN usd.is_exposed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(ku.id)), 2)
                            END as exposure_rate_percent
                        FROM keywords k
                        JOIN categories c ON k.category_id = c.id
                        LEFT JOIN keyword_urls ku ON k.id = ku.keyword_id AND ku.is_active = 1
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
                        WHERE k.is_active = 1 AND c.is_active = 1
                        GROUP BY k.id, c.name, c.display_name
                    )
                    SELECT 
                        category_name,
                        category_display_name,
                        COALESCE(SUM(total_urls_scanned), 0) as total_urls,
                        COALESCE(SUM(exposed_urls_count), 0) as exposed_urls,
                        COALESCE(SUM(hidden_urls_count), 0) as hidden_urls,
                        COALESCE(SUM(error_urls_count), 0) as error_urls,
                        COUNT(DISTINCT keyword_id) as total_keywords,
                        COUNT(DISTINCT CASE WHEN total_urls_scanned > 0 THEN keyword_id END) as keywords_with_urls,
                        COUNT(DISTINCT CASE WHEN exposed_urls_count > 0 THEN keyword_id END) as exposed_keywords,
                        COUNT(DISTINCT CASE WHEN total_urls_scanned > 0 AND exposed_urls_count = 0 THEN keyword_id END) as not_exposed_keywords,
                        COUNT(DISTINCT CASE WHEN total_urls_scanned = 0 THEN keyword_id END) as no_url_keywords,
                        COALESCE(AVG(exposure_rate_percent), 0) as avg_exposure_rate
                    FROM latest_scan_results
                    GROUP BY category_name, category_display_name
                    ORDER BY category_name
                `;

                const categoryStats = await executeQuery(categoryStatsQuery);
                
                categoryStats.forEach((catStat) => {
                    const catSuccessRate = catStat.keywords_with_urls > 0
                        ? Math.round((catStat.exposed_keywords / catStat.keywords_with_urls) * 100)
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
                            averageExposureRate: Math.round(parseFloat(catStat.avg_exposure_rate) || 0),
                            lastScanTime: catStat.last_scan_time,
                            exposureStatsData: [
                                { name: "노출됨", value: parseInt(catStat.exposed_keywords) || 0 },
                                { name: "노출 안됨", value: parseInt(catStat.not_exposed_keywords) || 0 },
                                { name: "URL 없음", value: parseInt(catStat.no_url_keywords) || 0 },
                            ],
                        },
                    };
                });
            } catch (categoryError) {
                console.error("Error fetching category stats:", categoryError);
            }
        }

        console.log("Pool status after:", getPoolStatus());
        console.log(`Total execution time: ${Date.now() - startTime}ms`);

        res.status(200).json({
            success: true,
            data: {
                summary,
                categoryData,
                allSummary: summary,
                timestamp: new Date().toISOString(),
            },
            executionTime: Date.now() - startTime,
        });

    } catch (error) {
        console.error("Statistics API error:", error);
        console.log("Pool status on error:", getPoolStatus());
        res.status(500).json({
            success: false,
            message: "Failed to fetch statistics",
            error: error.message,
            executionTime: Date.now() - startTime,
        });
    }
}