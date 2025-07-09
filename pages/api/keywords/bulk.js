// pages/api/keywords/bulk.js - 키워드 대량 등록 API
import { 
    executeQuery, 
    startTransaction, 
    commitTransaction, 
    rollbackTransaction 
} from "../../../lib/database";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    let connection = null;
    
    try {
        const { keywords, category_name, priority, urls } = req.body;

        // 입력 데이터 검증
        if (!keywords || !Array.isArray(keywords) && !category_name) {
            return res.status(400).json({
                success: false,
                message: "Keywords array or category_name is required",
            });
        }

        let keywordList = [];

        // 텍스트 방식 처리
        if (Array.isArray(keywords) && typeof keywords[0] === "string") {
            if (!category_name) {
                return res.status(400).json({
                    success: false,
                    message: "Category name is required for text input",
                });
            }

            // 카테고리 ID 조회
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

            // 키워드 리스트 구성
            keywordList = keywords.map(keyword => ({
                keyword_text: keyword.trim(),
                category_id: categoryId,
                category_name: category_name,
                priority: priority || 1,
                urls: urls || [],
            }));
        }
        // 키워드+URL 복합 방식 처리 (새로 추가)
        else if (Array.isArray(keywords) && typeof keywords[0] === "object" && keywords[0].hasOwnProperty('keyword_text')) {
            // 엑셀 방식과 동일하게 처리
            const categoryCache = new Map();
            
            for (const keywordObj of keywords) {
                const categoryName = keywordObj.category_name;
                
                if (!categoryCache.has(categoryName)) {
                    const categoryResult = await executeQuery(
                        "SELECT id FROM categories WHERE name = ? AND is_active = TRUE",
                        [categoryName]
                    );
                    
                    if (categoryResult.length === 0) {
                        return res.status(404).json({
                            success: false,
                            message: `Category '${categoryName}' not found`,
                        });
                    }
                    
                    categoryCache.set(categoryName, categoryResult[0].id);
                }
                
                keywordList.push({
                    keyword_text: keywordObj.keyword_text.trim(),
                    category_id: categoryCache.get(categoryName),
                    category_name: categoryName,
                    priority: keywordObj.priority || 1,
                    urls: keywordObj.urls || [],
                });
            }
        } 
        // 
        // 엑셀 방식 처리 (레거시 지원)
        else if (Array.isArray(keywords) && typeof keywords[0] === "object" && !keywords[0].hasOwnProperty('keyword_text')) {
            // 카테고리 ID 캐시
            const categoryCache = new Map();
            
            for (const keywordObj of keywords) {
                const categoryName = keywordObj.category_name;
                
                if (!categoryCache.has(categoryName)) {
                    const categoryResult = await executeQuery(
                        "SELECT id FROM categories WHERE name = ? AND is_active = TRUE",
                        [categoryName]
                    );
                    
                    if (categoryResult.length === 0) {
                        return res.status(404).json({
                            success: false,
                            message: `Category '${categoryName}' not found`,
                        });
                    }
                    
                    categoryCache.set(categoryName, categoryResult[0].id);
                }
                
                keywordList.push({
                    keyword_text: keywordObj.keyword_text.trim(),
                    category_id: categoryCache.get(categoryName),
                    category_name: categoryName,
                    priority: keywordObj.priority || 1,
                    urls: keywordObj.urls || [],
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid keywords format",
            });
        }

        if (keywordList.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid keywords provided",
            });
        }

        // 최대 등록 수 제한
        const MAX_KEYWORDS = 500;
        if (keywordList.length > MAX_KEYWORDS) {
            return res.status(400).json({
                success: false,
                message: `Maximum ${MAX_KEYWORDS} keywords allowed per bulk registration. You provided ${keywordList.length} keywords.`,
            });
        }

        console.log(`Starting bulk keyword registration for ${keywordList.length} keywords`);

        // 트랜잭션 시작
        connection = await startTransaction();

        let successful = 0;
        let failed = 0;
        const errors = [];

        try {
            for (const keywordData of keywordList) {
                try {
                    // 중복 키워드 체크
                    const [existingKeyword] = await connection.execute(
                        "SELECT id FROM keywords WHERE category_id = ? AND keyword_text = ?",
                        [keywordData.category_id, keywordData.keyword_text]
                    );

                    if (existingKeyword.length > 0) {
                        errors.push(`키워드 '${keywordData.keyword_text}' 이미 존재함`);
                        failed++;
                        continue;
                    }

                    // 키워드 삽입
                    const [keywordResult] = await connection.execute(
                        "INSERT INTO keywords (category_id, keyword_text, priority) VALUES (?, ?, ?)",
                        [keywordData.category_id, keywordData.keyword_text, keywordData.priority]
                    );

                    const keywordId = keywordResult.insertId;

                    // URL 삽입 (있는 경우)
                    if (keywordData.urls && keywordData.urls.length > 0) {
                        for (const urlData of keywordData.urls) {
                            try {
                                let urlString = "";
                                let urlType = "monitor";
                                
                                // URL 데이터 타입 처리
                                if (typeof urlData === "string") {
                                    urlString = urlData.trim();
                                } else if (typeof urlData === "object") {
                                    urlString = urlData.url || urlData.target_url || "";
                                    urlType = urlData.type || urlData.url_type || "monitor";
                                }
                                
                                if (urlString) {
                                    await connection.execute(
                                        "INSERT INTO keyword_urls (keyword_id, target_url, url_type) VALUES (?, ?, ?)",
                                        [keywordId, urlString, urlType]
                                    );
                                }
                            } catch (urlError) {
                                console.error(`URL insertion error for keyword ${keywordData.keyword_text}:`, urlError);
                                // URL 삽입 실패해도 키워드는 성공으로 간주
                            }
                        }
                    }

                    successful++;
                    console.log(`Successfully registered keyword: ${keywordData.keyword_text}`);

                } catch (keywordError) {
                    console.error(`Error registering keyword ${keywordData.keyword_text}:`, keywordError);
                    errors.push(`키워드 '${keywordData.keyword_text}' 등록 실패: ${keywordError.message}`);
                    failed++;
                }
            }

            // 트랜잭션 커밋
            await commitTransaction(connection);
            connection = null;

            console.log(`Bulk registration completed: ${successful} successful, ${failed} failed`);

            res.status(200).json({
                success: true,
                data: {
                    successful,
                    failed,
                    total: keywordList.length,
                    errors: errors.slice(0, 10), // 최대 10개의 에러만 반환
                },
                message: `${successful}개 키워드 등록 완료, ${failed}개 실패`,
            });

        } catch (bulkError) {
            if (connection) {
                await rollbackTransaction(connection);
                connection = null;
            }
            throw bulkError;
        }

    } catch (error) {
        console.error("Bulk keyword registration error:", error);
        
        if (connection) {
            try {
                await rollbackTransaction(connection);
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError);
            }
        }

        res.status(500).json({
            success: false,
            message: "Bulk keyword registration failed",
            error: error.message,
        });
    }
}