import { executeQuery } from "../../../lib/database";

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
        // Delete category
        try {
            const { category_id } = req.body;

            if (!category_id) {
                return res.status(400).json({
                    success: false,
                    message: "Category ID is required",
                });
            }

            // Check if category has keywords
            const keywords = await executeQuery(
                "SELECT COUNT(*) as count FROM keywords WHERE category_id = ?",
                [category_id]
            );

            if (keywords[0].count > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete category. It has ${keywords[0].count} keyword(s) associated with it.`,
                });
            }

            // Delete category
            await executeQuery("DELETE FROM categories WHERE id = ?", [
                category_id,
            ]);

            res.status(200).json({
                success: true,
                message: "Category deleted successfully",
            });
        } catch (error) {
            console.error("Delete category error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete category",
                error: error.message,
            });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
