import { executeQuery } from "../../lib/database";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { keyword } = req.query;

        let whereClause = "";
        let params = [];

        if (keyword && keyword !== "all") {
            whereClause = "WHERE ku.keyword_id = ?";
            params.push(keyword);
        }

        // Get URLs with their latest scan results
        const urlsQuery = `
      SELECT 
        ku.id,
        ku.keyword_id,
        ku.target_url,
        ku.url_type,
        ku.is_active,
        ku.created_at,
        ku.updated_at,
        k.keyword_text,
        c.display_name as category_name,
        usd.is_exposed,
        usd.exposure_rank,
        usd.response_code,
        usd.scanned_at as last_scanned
      FROM keyword_urls ku
      JOIN keywords k ON ku.keyword_id = k.id
      JOIN categories c ON k.category_id = c.id
      LEFT JOIN url_scan_details usd ON ku.id = usd.keyword_url_id
      LEFT JOIN scan_results sr ON usd.scan_result_id = sr.id
      LEFT JOIN scan_sessions ss ON sr.session_id = ss.id
      ${whereClause}
      AND (ss.id IS NULL OR ss.id = (
        SELECT MAX(ss2.id) 
        FROM scan_sessions ss2 
        JOIN scan_results sr2 ON ss2.id = sr2.session_id
        JOIN url_scan_details usd2 ON sr2.id = usd2.scan_result_id
        WHERE usd2.keyword_url_id = ku.id 
        AND ss2.scan_status = 'completed'
      ))
      ORDER BY ku.created_at DESC
    `;

        const urls = await executeQuery(urlsQuery, params);

        const processedUrls = urls.map((url) => ({
            id: url.id,
            keyword_id: url.keyword_id,
            target_url: url.target_url,
            url_type: url.url_type,
            is_active: Boolean(url.is_active),
            keyword_text: url.keyword_text,
            category_name: url.category_name,
            is_exposed: url.is_exposed,
            exposure_rank: url.exposure_rank,
            response_code: url.response_code,
            last_scanned: url.last_scanned,
            created_at: url.created_at,
            updated_at: url.updated_at,
        }));

        res.status(200).json({
            success: true,
            data: processedUrls,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("URLs API error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch URLs",
            error: error.message,
        });
    }
}
