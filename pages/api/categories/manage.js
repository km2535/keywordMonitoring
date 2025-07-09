// pages/api/categories/manage.js - 외래 키 제약 조건 해결된 버전
import { 
    executeQuery, 
    startTransaction, 
    commitTransaction, 
    rollbackTransaction 
} from "../../../lib/database";

export default async function handler(req, res) {
    if (req.method === "POST") {
        // Add new category
        try {
            const {
                name,
                display_name,
                description,
                is_active = true,
            } = req.body;

            if (!name || !display_name) {
                return res.status(400).json({
                    success: false,
                    message: "Category name and display name are required",
                });
            }

            // Check if category already exists
            const existingCategory = await executeQuery(
                "SELECT id FROM categories WHERE name = ?",
                [name]
            );

            if (existingCategory.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Category with this name already exists",
                });
            }

            // Insert category
            const result = await executeQuery(
                "INSERT INTO categories (name, display_name, description, is_active) VALUES (?, ?, ?, ?)",
                [name, display_name, description, is_active]
            );

            res.status(201).json({
                success: true,
                data: {
                    category_id: result.insertId,
                    message: "Category added successfully",
                },
            });
        } catch (error) {
            console.error("Add category error:", error);

            if (error.code === "ER_DUP_ENTRY") {
                return res.status(400).json({
                    success: false,
                    message: "Category name already exists",
                });
            }

            res.status(500).json({
                success: false,
                message: "Failed to add category",
                error: error.message,
            });
        }
    } else if (req.method === "PUT") {
        // Update existing category
        try {
            const { category_id, display_name, description, is_active } =
                req.body;

            if (!category_id) {
                return res.status(400).json({
                    success: false,
                    message: "Category ID is required",
                });
            }

            // Build update query dynamically
            let updateFields = [];
            let params = [];

            if (display_name !== undefined) {
                updateFields.push("display_name = ?");
                params.push(display_name);
            }

            if (description !== undefined) {
                updateFields.push("description = ?");
                params.push(description);
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

            params.push(category_id);

            const updateQuery = `UPDATE categories SET ${updateFields.join(
                ", "
            )} WHERE id = ?`;
            await executeQuery(updateQuery, params);

            res.status(200).json({
                success: true,
                message: "Category updated successfully",
            });
        } catch (error) {
            console.error("Update category error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update category",
                error: error.message,
            });
        }
    } else if (req.method === "DELETE") {
        // Delete category with cascading delete support - 외래 키 제약 조건 해결
        let connection = null;
        
        try {
            const { category_id } = req.body;

            if (!category_id) {
                return res.status(400).json({
                    success: false,
                    message: "Category ID is required",
                });
            }

            console.log("Attempting to delete category:", category_id);

            // Get category info first
            const categoryInfo = await executeQuery(
                "SELECT name, display_name FROM categories WHERE id = ?",
                [category_id]
            );

            if (categoryInfo.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found",
                });
            }

            // Check for associated keywords and get count
            const keywordCheck = await executeQuery(
                "SELECT COUNT(*) as count FROM keywords WHERE category_id = ?",
                [category_id]
            );

            const keywordCount = keywordCheck[0].count;
            console.log(`Category has ${keywordCount} associated keywords`);

            // Start transaction
            connection = await startTransaction();

            try {
                if (keywordCount > 0) {
                    console.log("Deleting associated data...");
                    
                    // Get all keyword IDs for this category
                    const [keywordIds] = await connection.execute(
                        "SELECT id FROM keywords WHERE category_id = ?",
                        [category_id]
                    );

                    if (keywordIds.length > 0) {
                        const keywordIdList = keywordIds.map(k => k.id);
                        const keywordPlaceholders = keywordIdList.map(() => '?').join(',');

                        // Get all keyword_url IDs for these keywords
                        const [keywordUrls] = await connection.execute(
                            `SELECT id FROM keyword_urls WHERE keyword_id IN (${keywordPlaceholders})`,
                            keywordIdList
                        );

                        if (keywordUrls.length > 0) {
                            const urlIds = keywordUrls.map(url => url.id);
                            const urlPlaceholders = urlIds.map(() => '?').join(',');

                            // Delete url_scan_details first (deepest level)
                            try {
                                const [deleteScanDetails] = await connection.execute(
                                    `DELETE FROM url_scan_details WHERE keyword_url_id IN (${urlPlaceholders})`,
                                    urlIds
                                );
                                console.log(`Deleted ${deleteScanDetails.affectedRows} url_scan_details`);
                            } catch (scanError) {
                                console.log("URL scan details deletion skipped:", scanError.message);
                            }

                            // Delete exposure_logs that reference keyword_urls - 🔥 중요한 추가!
                            try {
                                const [deleteExposureLogs] = await connection.execute(
                                    `DELETE FROM exposure_logs WHERE keyword_url_id IN (${urlPlaceholders})`,
                                    urlIds
                                );
                                console.log(`Deleted ${deleteExposureLogs.affectedRows} exposure_logs (by keyword_url_id)`);
                            } catch (exposureError) {
                                console.log("Exposure logs deletion skipped:", exposureError.message);
                            }
                        }

                        // Delete exposure_logs that directly reference keywords - 추가 안전 장치
                        try {
                            const [deleteKeywordExposureLogs] = await connection.execute(
                                `DELETE FROM exposure_logs WHERE keyword_id IN (${keywordPlaceholders})`,
                                keywordIdList
                            );
                            console.log(`Deleted ${deleteKeywordExposureLogs.affectedRows} exposure_logs (by keyword_id)`);
                        } catch (exposureError) {
                            console.log("Keyword exposure logs deletion skipped:", exposureError.message);
                        }

                        // Delete scan_results (if table exists)
                        try {
                            const [deleteScanResults] = await connection.execute(
                                `DELETE FROM scan_results WHERE keyword_id IN (${keywordPlaceholders})`,
                                keywordIdList
                            );
                            console.log(`Deleted ${deleteScanResults.affectedRows} scan_results`);
                        } catch (scanError) {
                            console.log("Scan results deletion skipped:", scanError.message);
                        }

                        // Delete keyword URLs
                        const [deleteUrls] = await connection.execute(
                            `DELETE FROM keyword_urls WHERE keyword_id IN (${keywordPlaceholders})`,
                            keywordIdList
                        );
                        console.log(`Deleted ${deleteUrls.affectedRows} keyword URLs`);
                    }

                    // Delete keywords
                    const [deleteKeywords] = await connection.execute(
                        "DELETE FROM keywords WHERE category_id = ?",
                        [category_id]
                    );
                    console.log(`Deleted ${deleteKeywords.affectedRows} keywords`);
                }

                // Finally delete the category
                const [deleteResult] = await connection.execute(
                    "DELETE FROM categories WHERE id = ?",
                    [category_id]
                );

                if (deleteResult.affectedRows === 0) {
                    throw new Error("Category not found or already deleted");
                }

                // Commit transaction
                await commitTransaction(connection);
                connection = null; // 연결이 이미 해제됨
                console.log("Category deletion completed successfully");

                res.status(200).json({
                    success: true,
                    message: `Category "${categoryInfo[0].display_name}" and all associated data (${keywordCount} keywords) deleted successfully`,
                    deletedKeywords: keywordCount,
                });

            } catch (deleteError) {
                // Rollback on error
                if (connection) {
                    await rollbackTransaction(connection);
                    connection = null;
                }
                throw deleteError;
            }

        } catch (error) {
            console.error("Delete category error:", error);
            
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
                message: "Failed to delete category: " + error.message,
                error: error.message,
            });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}