import { executeQuery } from "../../../lib/database";

export default async function handler(req, res) {
    if (req.method === "POST") {
        // Add new keyword
        try {
            const {
                category_name,
                keyword_text,
                priority = 1,
                urls = [],
            } = req.body;

            if (!category_name || !keyword_text) {
                return res.status(400).json({
                    success: false,
                    message: "Category name and keyword text are required",
                });
            }

            // Get category ID
            const categoryResult = await executeQuery(
                "SELECT id FROM categories WHERE name = ? AND is_active = TRUE",
                [category_name]
            );

            if (categoryResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found",
                });
            }

            const categoryId = categoryResult[0].id;

            // Insert keyword
            const keywordResult = await executeQuery(
                "INSERT INTO keywords (category_id, keyword_text, priority) VALUES (?, ?, ?)",
                [categoryId, keyword_text, priority]
            );

            const keywordId = keywordResult.insertId;

            // Insert URLs if provided
            if (urls.length > 0) {
                const urlInserts = urls.map((url) => [
                    keywordId,
                    url.url,
                    url.type || "monitor",
                ]);
                await executeQuery(
                    "INSERT INTO keyword_urls (keyword_id, target_url, url_type) VALUES ?",
                    [urlInserts]
                );
            }

            res.status(201).json({
                success: true,
                data: {
                    keyword_id: keywordId,
                    message: "Keyword added successfully",
                },
            });
        } catch (error) {
            console.error("Add keyword error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to add keyword",
                error: error.message,
            });
        }
    } else if (req.method === "PUT") {
        // Update existing keyword
        try {
            const { keyword_id, keyword_text, priority, is_active } = req.body;

            if (!keyword_id) {
                return res.status(400).json({
                    success: false,
                    message: "Keyword ID is required",
                });
            }

            // Build update query dynamically
            let updateFields = [];
            let params = [];

            if (keyword_text !== undefined) {
                updateFields.push("keyword_text = ?");
                params.push(keyword_text);
            }

            if (priority !== undefined) {
                updateFields.push("priority = ?");
                params.push(priority);
            }

            if (is_active !== undefined) {
                updateFields.push("is_active = ?");
                params.push(is_active);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No fields to update",
                });
            }

            params.push(keyword_id);

            const updateQuery = `UPDATE keywords SET ${updateFields.join(
                ", "
            )} WHERE id = ?`;
            await executeQuery(updateQuery, params);

            res.status(200).json({
                success: true,
                message: "Keyword updated successfully",
            });
        } catch (error) {
            console.error("Update keyword error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update keyword",
                error: error.message,
            });
        }
    } else if (req.method === "DELETE") {
        // Delete keyword
        try {
            const { keyword_id } = req.body;

            if (!keyword_id) {
                return res.status(400).json({
                    success: false,
                    message: "Keyword ID is required",
                });
            }

            // Delete keyword (cascade will handle URLs)
            await executeQuery("DELETE FROM keywords WHERE id = ?", [
                keyword_id,
            ]);

            res.status(200).json({
                success: true,
                message: "Keyword deleted successfully",
            });
        } catch (error) {
            console.error("Delete keyword error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete keyword",
                error: error.message,
            });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
