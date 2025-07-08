import { executeQuery } from "../../lib/database";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        console.log("Categories API called");

        // Get all categories with additional metadata (including inactive ones)
        const categories = await executeQuery(`
      SELECT 
        c.id,
        c.name,
        c.display_name,
        c.description,
        c.is_active,
        c.created_at,
        c.updated_at,
        COUNT(k.id) as keyword_count,
        COUNT(CASE WHEN k.is_active = 1 THEN 1 END) as active_keyword_count
      FROM categories c
      LEFT JOIN keywords k ON c.id = k.category_id
      GROUP BY c.id, c.name, c.display_name, c.description, c.is_active, c.created_at, c.updated_at
      ORDER BY c.name
    `);

        console.log("Categories found:", categories.length);

        res.status(200).json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error("Categories API error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch categories",
            error: error.message,
        });
    }
}
