import { executeQuery } from "../../lib/database";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { category } = req.query;

        let whereClause = "";
        let params = [];

        if (category && category !== "all") {
            whereClause = "WHERE c.name = ?";
            params.push(category);
        }

        // Get statistics using the optimized views
        let statisticsQuery;
        if (category === "all" || !category) {
            // Get overall statistics from all categories
            statisticsQuery = `
        SELECT 
          'all' as category_name,
          '전체' as category_display_name,
          SUM(lsr.total_urls_scanned) as total_urls,
          SUM(lsr.exposed_urls_count) as exposed_urls,
          SUM(lsr.hidden_urls_count) as hidden_urls,
          SUM(lsr.error_urls_count) as error_urls,
          COUNT(DISTINCT lsr.keyword_id) as total_keywords,
          COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned > 0 THEN lsr.keyword_id END) as keywords_with_urls,
          COUNT(DISTINCT CASE WHEN lsr.exposed_urls_count > 0 THEN lsr.keyword_id END) as exposed_keywords,
          COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned > 0 AND lsr.exposed_urls_count = 0 THEN lsr.keyword_id END) as not_exposed_keywords,
          COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned = 0 THEN lsr.keyword_id END) as no_url_keywords,
          AVG(lsr.exposure_rate_percent) as avg_exposure_rate,
          MAX(lsr.scanned_at) as last_scan_time
        FROM v_latest_scan_results lsr
        JOIN categories c ON lsr.category_name = c.name
        ${whereClause}
      `;
        } else {
            // Get statistics for specific category
            statisticsQuery = `
        SELECT 
          lsr.category_name,
          lsr.category_display_name,
          SUM(lsr.total_urls_scanned) as total_urls,
          SUM(lsr.exposed_urls_count) as exposed_urls,
          SUM(lsr.hidden_urls_count) as hidden_urls,
          SUM(lsr.error_urls_count) as error_urls,
          COUNT(DISTINCT lsr.keyword_id) as total_keywords,
          COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned > 0 THEN lsr.keyword_id END) as keywords_with_urls,
          COUNT(DISTINCT CASE WHEN lsr.exposed_urls_count > 0 THEN lsr.keyword_id END) as exposed_keywords,
          COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned > 0 AND lsr.exposed_urls_count = 0 THEN lsr.keyword_id END) as not_exposed_keywords,
          COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned = 0 THEN lsr.keyword_id END) as no_url_keywords,
          AVG(lsr.exposure_rate_percent) as avg_exposure_rate,
          MAX(lsr.scanned_at) as last_scan_time
        FROM v_latest_scan_results lsr
        JOIN categories c ON lsr.category_name = c.name
        ${whereClause}
        GROUP BY lsr.category_name, lsr.category_display_name
      `;
        }

        const stats = await executeQuery(statisticsQuery, params);
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

        // Calculate success rate
        const exposureSuccessRate =
            stat.keywords_with_urls > 0
                ? Math.round(
                      (stat.exposed_keywords / stat.keywords_with_urls) * 100
                  )
                : 0;

        // Prepare chart data
        const exposureStatsData = [
            { name: "노출됨", value: stat.exposed_keywords || 0 },
            { name: "노출 안됨", value: stat.not_exposed_keywords || 0 },
            { name: "URL 없음", value: stat.no_url_keywords || 0 },
        ];

        const summary = {
            totalKeywords: stat.total_keywords || 0,
            keywordsWithUrls: stat.keywords_with_urls || 0,
            exposedKeywords: stat.exposed_keywords || 0,
            notExposedKeywords: stat.not_exposed_keywords || 0,
            noUrlKeywords: stat.no_url_keywords || 0,
            totalUrls: stat.total_urls || 0,
            exposedUrls: stat.exposed_urls || 0,
            hiddenUrls: stat.hidden_urls || 0,
            errorUrls: stat.error_urls || 0,
            exposureSuccessRate,
            averageExposureRate: Math.round(stat.avg_exposure_rate || 0),
            lastScanTime: stat.last_scan_time,
            exposureStatsData,
        };

        // If requesting all categories, also get individual category stats
        let categoryData = {};
        if (category === "all" || !category) {
            const categoryStatsQuery = `
        SELECT 
          lsr.category_name,
          lsr.category_display_name,
          SUM(lsr.total_urls_scanned) as total_urls,
          SUM(lsr.exposed_urls_count) as exposed_urls,
          SUM(lsr.hidden_urls_count) as hidden_urls,
          SUM(lsr.error_urls_count) as error_urls,
          COUNT(DISTINCT lsr.keyword_id) as total_keywords,
          COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned > 0 THEN lsr.keyword_id END) as keywords_with_urls,
          COUNT(DISTINCT CASE WHEN lsr.exposed_urls_count > 0 THEN lsr.keyword_id END) as exposed_keywords,
          COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned > 0 AND lsr.exposed_urls_count = 0 THEN lsr.keyword_id END) as not_exposed_keywords,
          COUNT(DISTINCT CASE WHEN lsr.total_urls_scanned = 0 THEN lsr.keyword_id END) as no_url_keywords,
          AVG(lsr.exposure_rate_percent) as avg_exposure_rate,
          MAX(lsr.scanned_at) as last_scan_time
        FROM v_latest_scan_results lsr
        GROUP BY lsr.category_name, lsr.category_display_name
        ORDER BY lsr.category_name
      `;

            const categoryStats = await executeQuery(categoryStatsQuery);

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
                        totalKeywords: catStat.total_keywords || 0,
                        keywordsWithUrls: catStat.keywords_with_urls || 0,
                        exposedKeywords: catStat.exposed_keywords || 0,
                        notExposedKeywords: catStat.not_exposed_keywords || 0,
                        noUrlKeywords: catStat.no_url_keywords || 0,
                        totalUrls: catStat.total_urls || 0,
                        exposedUrls: catStat.exposed_urls || 0,
                        hiddenUrls: catStat.hidden_urls || 0,
                        errorUrls: catStat.error_urls || 0,
                        exposureSuccessRate: catSuccessRate,
                        averageExposureRate: Math.round(
                            catStat.avg_exposure_rate || 0
                        ),
                        lastScanTime: catStat.last_scan_time,
                        exposureStatsData: [
                            {
                                name: "노출됨",
                                value: catStat.exposed_keywords || 0,
                            },
                            {
                                name: "노출 안됨",
                                value: catStat.not_exposed_keywords || 0,
                            },
                            {
                                name: "URL 없음",
                                value: catStat.no_url_keywords || 0,
                            },
                        ],
                    },
                };
            });
        }

        res.status(200).json({
            success: true,
            data: {
                summary,
                categoryData,
                allSummary: summary,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("Statistics API error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch statistics",
            error: error.message,
        });
    }
}
