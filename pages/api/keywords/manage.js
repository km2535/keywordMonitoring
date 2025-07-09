// pages/api/keywords/manage.js - 외래 키 제약 조건 해결된 버전
import { 
    executeQuery, 
    startTransaction, 
    commitTransaction, 
    rollbackTransaction 
} from "../../../lib/database";

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
        // Delete keyword with proper cascade deletion - 외래 키 제약 조건 해결
        let connection = null;
        
        try {
            const { keyword_id } = req.body;

            if (!keyword_id) {
                return res.status(400).json({
                    success: false,
                    message: "Keyword ID is required",
                });
            }

            console.log("Starting keyword deletion process for ID:", keyword_id);

            // Get keyword info first
            const keywordInfo = await executeQuery(
                "SELECT keyword_text FROM keywords WHERE id = ?",
                [keyword_id]
            );

            if (keywordInfo.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Keyword not found",
                });
            }

            const keywordText = keywordInfo[0].keyword_text;

            // Start transaction
            connection = await startTransaction();

            try {
                // Step 1: Get all keyword_url IDs for this keyword
                const [keywordUrls] = await connection.execute(
                    "SELECT id FROM keyword_urls WHERE keyword_id = ?",
                    [keyword_id]
                );

                console.log(`Found ${keywordUrls.length} URLs for keyword`);

                if (keywordUrls.length > 0) {
                    const urlIds = keywordUrls.map(url => url.id);
                    const placeholders = urlIds.map(() => '?').join(',');

                    // Step 2: Delete url_scan_details first (deepest level)
                    try {
                        const [deleteScanDetails] = await connection.execute(
                            `DELETE FROM url_scan_details WHERE keyword_url_id IN (${placeholders})`,
                            urlIds
                        );
                        console.log(`Deleted ${deleteScanDetails.affectedRows} url_scan_details records`);
                    } catch (scanError) {
                        console.log("url_scan_details deletion skipped (table might not exist):", scanError.message);
                    }

                    // Step 3: Delete exposure_logs that reference keyword_urls - 🔥 이 부분이 누락되어 있었음!
                    try {
                        const [deleteExposureLogs] = await connection.execute(
                            `DELETE FROM exposure_logs WHERE keyword_url_id IN (${placeholders})`,
                            urlIds
                        );
                        console.log(`Deleted ${deleteExposureLogs.affectedRows} exposure_logs records`);
                    } catch (exposureError) {
                        console.log("exposure_logs deletion skipped (table might not exist):", exposureError.message);
                    }

                    // Step 4: Delete keyword_urls
                    const [deleteUrls] = await connection.execute(
                        `DELETE FROM keyword_urls WHERE keyword_id = ?`,
                        [keyword_id]
                    );
                    console.log(`Deleted ${deleteUrls.affectedRows} keyword_urls records`);
                }

                // Step 5: Delete scan_results that directly reference the keyword
                try {
                    const [deleteScanResults] = await connection.execute(
                        "DELETE FROM scan_results WHERE keyword_id = ?",
                        [keyword_id]
                    );
                    console.log(`Deleted ${deleteScanResults.affectedRows} scan_results records`);
                } catch (scanError) {
                    console.log("scan_results deletion skipped (table might not exist):", scanError.message);
                }

                // Step 6: Delete exposure_logs that directly reference the keyword - 추가 안전 장치
                try {
                    const [deleteKeywordExposureLogs] = await connection.execute(
                        "DELETE FROM exposure_logs WHERE keyword_id = ?",
                        [keyword_id]
                    );
                    console.log(`Deleted ${deleteKeywordExposureLogs.affectedRows} additional exposure_logs records`);
                } catch (exposureError) {
                    console.log("keyword exposure_logs deletion skipped:", exposureError.message);
                }

                // Step 7: Finally delete the keyword
                const [deleteKeyword] = await connection.execute(
                    "DELETE FROM keywords WHERE id = ?",
                    [keyword_id]
                );

                if (deleteKeyword.affectedRows === 0) {
                    throw new Error("Keyword not found or already deleted");
                }

                console.log("Keyword deleted successfully");

                // Commit transaction
                await commitTransaction(connection);
                connection = null; // 연결이 이미 해제됨

                res.status(200).json({
                    success: true,
                    message: `Keyword "${keywordText}" and all associated data deleted successfully`,
                });

            } catch (deleteError) {
                // Rollback on error
                if (connection) {
                    await rollbackTransaction(connection);
                    connection = null;
                }
                console.error("Error during deletion, transaction rolled back:", deleteError);
                throw deleteError;
            }

        } catch (error) {
            console.error("Delete keyword error:", error);
            
            // Make sure to rollback if something went wrong
            if (connection) {
                try {
                    await rollbackTransaction(connection);
                } catch (rollbackError) {
                    console.error("Rollback error:", rollbackError);
                }
            }

            res.status(500).json({
                success: false,
                message: "Failed to delete keyword: " + error.message,
                error: error.message,
            });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}