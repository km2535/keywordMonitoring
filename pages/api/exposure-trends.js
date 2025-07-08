import { executeQuery } from "../../lib/database";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { category, days = 30, limit = 100 } = req.query;

        let whereClause = "";
        let params = [];

        // Add date filter
        whereClause = "WHERE et.changed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
        params.push(parseInt(days));

        if (category && category !== "all") {
            whereClause += " AND et.category_name = ?";
            params.push(category);
        }

        // Get exposure trends from the view
        const trendsQuery = `
      SELECT 
        et.target_url,
        et.keyword_text,
        et.category_name,
        et.previous_status,
        et.current_status,
        et.change_type,
        et.exposure_rank,
        et.changed_at,
        et.trend_direction
      FROM v_exposure_trends et
      ${whereClause}
      ORDER BY et.changed_at DESC
      LIMIT ?
    `;

        params.push(parseInt(limit));

        const trends = await executeQuery(trendsQuery, params);

        // Group trends by change type for summary
        const trendSummary = {
            newly_exposed: trends.filter(
                (t) => t.change_type === "newly_exposed"
            ).length,
            newly_hidden: trends.filter((t) => t.change_type === "newly_hidden")
                .length,
            rank_changed: trends.filter((t) => t.change_type === "rank_changed")
                .length,
            total_changes: trends.length,
        };

        res.status(200).json({
            success: true,
            data: {
                trends: trends.map((trend) => ({
                    ...trend,
                    previous_status: Boolean(trend.previous_status),
                    current_status: Boolean(trend.current_status),
                    changed_at: trend.changed_at,
                })),
                summary: trendSummary,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Exposure trends API error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch exposure trends",
            error: error.message,
        });
    }
}
