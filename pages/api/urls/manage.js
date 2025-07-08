import { executeQuery } from "../../../lib/database";

export default async function handler(req, res) {
    if (req.method === "POST") {
        // Add new URL to keyword
        try {
            const { keyword_id, target_url, url_type = "monitor" } = req.body;

            if (!keyword_id || !target_url) {
                return res.status(400).json({
                    success: false,
                    message: "Keyword ID and target URL are required",
                });
            }

            // Check if keyword exists
            const keywordExists = await executeQuery(
                "SELECT id FROM keywords WHERE id = ? AND is_active = TRUE",
                [keyword_id]
            );

            if (keywordExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Keyword not found",
                });
            }

            // Insert URL
            const urlResult = await executeQuery(
                "INSERT INTO keyword_urls (keyword_id, target_url, url_type) VALUES (?, ?, ?)",
                [keyword_id, target_url, url_type]
            );

            res.status(201).json({
                success: true,
                data: {
                    url_id: urlResult.insertId,
                    message: "URL added successfully",
                },
            });
        } catch (error) {
            console.error("Add URL error:", error);

            if (error.code === "ER_DUP_ENTRY") {
                return res.status(400).json({
                    success: false,
                    message: "URL already exists for this keyword",
                });
            }

            res.status(500).json({
                success: false,
                message: "Failed to add URL",
                error: error.message,
            });
        }
    } else if (req.method === "PUT") {
        // Update existing URL
        try {
            const { url_id, target_url, url_type, is_active } = req.body;

            if (!url_id) {
                return res.status(400).json({
                    success: false,
                    message: "URL ID is required",
                });
            }

            // Build update query dynamically
            let updateFields = [];
            let params = [];

            if (target_url !== undefined) {
                updateFields.push("target_url = ?");
                params.push(target_url);
            }

            if (url_type !== undefined) {
                updateFields.push("url_type = ?");
                params.push(url_type);
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

            params.push(url_id);

            const updateQuery = `UPDATE keyword_urls SET ${updateFields.join(
                ", "
            )} WHERE id = ?`;
            await executeQuery(updateQuery, params);

            res.status(200).json({
                success: true,
                message: "URL updated successfully",
            });
        } catch (error) {
            console.error("Update URL error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update URL",
                error: error.message,
            });
        }
    } else if (req.method === "DELETE") {
        // Delete URL
        try {
            const { url_id } = req.body;

            if (!url_id) {
                return res.status(400).json({
                    success: false,
                    message: "URL ID is required",
                });
            }

            // Delete URL
            await executeQuery("DELETE FROM keyword_urls WHERE id = ?", [
                url_id,
            ]);

            res.status(200).json({
                success: true,
                message: "URL deleted successfully",
            });
        } catch (error) {
            console.error("Delete URL error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete URL",
                error: error.message,
            });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
