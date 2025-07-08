import { executeQuery } from "../../lib/database";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { category, limit = 10 } = req.query;

        let whereClause = "";
        let params = [];

        if (category && category !== "all") {
            whereClause = "WHERE c.name = ?";
            params.push(category);
        }

        // Get recent scan sessions with performance data
        const sessionsQuery = `
      SELECT 
        sp.session_id,
        sp.category_name,
        sp.session_name,
        sp.scan_type,
        sp.started_at,
        sp.completed_at,
        sp.duration_minutes,
        sp.total_keywords,
        sp.processed_keywords,
        sp.total_urls,
        sp.successful_scans,
        sp.failed_scans,
        sp.success_rate_percent
      FROM v_scan_performance sp
      JOIN categories c ON sp.category_name = c.name
      ${whereClause}
      ORDER BY sp.started_at DESC
      LIMIT ?
    `;

        params.push(parseInt(limit));

        const sessions = await executeQuery(sessionsQuery, params);

        res.status(200).json({
            success: true,
            data: sessions,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Scan sessions API error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch scan sessions",
            error: error.message,
        });
    }
}
