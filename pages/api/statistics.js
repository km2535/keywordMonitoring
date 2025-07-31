// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/pages/api/statistics.js
import { queryAllNotionPages } from "../../lib/notion";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    let startTime = Date.now();
    
    try {
        // 클라이언트에서 요청한 카테고리 (all, R1, R2 등)
        const { category } = req.query; 
        console.log("Statistics API called for category:", category);

        const rawNotionPages = await queryAllNotionPages();

        // 각 'R' 값(카테고리)별 통계 데이터를 저장할 맵
        const categoryStats = {};
        // 전체 요약을 위한 변수
        let allSummary = {
            totalKeywords: 0,
            keywordsWithUrls: 0,
            exposedKeywords: 0,
            notExposedKeywords: 0,
            noUrlKeywords: 0,
            totalUrls: 0,
            exposedUrls: 0,
            hiddenUrls: 0,
            errorUrls: 0,
            exposureSuccessRate: 0,
            averageExposureRate: 0, // Notion API는 직접적인 랭크가 없으므로 계산 방식 고려
            exposureStatsData: [
                { name: "노출됨", value: 0 },
                { name: "노출 안됨", value: 0 },
                { name: "URL 없음", value: 0 },
            ],
        };

        rawNotionPages.forEach(page => {
            const properties = page.properties;
            const keywordText = properties?.['키워드']?.title?.[0]?.plain_text || '';
            const originalUrl = properties?.['기존글url']?.url || null;
            const exposureStatusNotion = properties?.['상위 노출 여부']?.status?.name || '미확인';
            const rValue = properties?.['R']?.select?.name || 'N/A'; // 'R' 속성 값

            // 'R' 값별 통계 초기화
            if (!categoryStats[rValue]) {
                categoryStats[rValue] = {
                    totalKeywords: 0,
                    keywordsWithUrls: 0,
                    exposedKeywords: 0,
                    notExposedKeywords: 0,
                    noUrlKeywords: 0,
                    totalUrls: 0,
                    exposedUrls: 0,
                    hiddenUrls: 0,
                    errorUrls: 0,
                    exposureSuccessRate: 0,
                    averageExposureRate: 0,
                    exposureStatsData: [
                        { name: "노출됨", value: 0 },
                        { name: "노출 안됨", value: 0 },
                        { name: "URL 없음", value: 0 },
                    ],
                };
            }

            // 키워드가 유효한 경우만 통계에 포함
            if (keywordText) {
                categoryStats[rValue].totalKeywords++;
                allSummary.totalKeywords++;

                const urlsData = [];
                if (originalUrl) {
                    urlsData.push({ url: originalUrl });
                }

                if (urlsData.length > 0) {
                    categoryStats[rValue].keywordsWithUrls++;
                    allSummary.keywordsWithUrls++;
                    categoryStats[rValue].totalUrls += urlsData.length;
                    allSummary.totalUrls += urlsData.length;

                    if (exposureStatusNotion === "최상단 노출") {
                        categoryStats[rValue].exposedKeywords++;
                        allSummary.exposedKeywords++;
                        categoryStats[rValue].exposedUrls += urlsData.length;
                        allSummary.exposedUrls += urlsData.length;
                    } else if (exposureStatusNotion === "노출X" || exposureStatusNotion === "저품질") {
                        categoryStats[rValue].notExposedKeywords++;
                        allSummary.notExposedKeywords++;
                        categoryStats[rValue].hiddenUrls += urlsData.length;
                        allSummary.hiddenUrls += urlsData.length;
                    } else if (exposureStatusNotion === "미발행") {
                        categoryStats[rValue].noUrlKeywords++; // URL은 있지만 '미발행' 상태
                        allSummary.noUrlKeywords++;
                    } else { // 기타 미확인 상태
                        categoryStats[rValue].errorUrls += urlsData.length;
                        allSummary.errorUrls += urlsData.length;
                    }
                } else {
                    categoryStats[rValue].noUrlKeywords++;
                    allSummary.noUrlKeywords++;
                }
            }
        });

        // 각 카테고리 및 전체에 대한 노출 성공률 계산
        for (const rVal in categoryStats) {
            const stats = categoryStats[rVal];
            stats.exposureSuccessRate = stats.keywordsWithUrls > 0 ? Math.round((stats.exposedKeywords / stats.keywordsWithUrls) * 100) : 0;
            stats.averageExposureRate = stats.exposureSuccessRate; // Notion API는 평균 랭크 직접 제공 안 함
            stats.exposureStatsData = [
                { name: "노출됨", value: stats.exposedKeywords },
                { name: "노출 안됨", value: stats.notExposedKeywords },
                { name: "URL 없음", value: stats.noUrlKeywords + (stats.totalKeywords - stats.keywordsWithUrls - stats.noUrlKeywords) },
            ];
        }

        allSummary.exposureSuccessRate = allSummary.keywordsWithUrls > 0 ? Math.round((allSummary.exposedKeywords / allSummary.keywordsWithUrls) * 100) : 0;
        allSummary.averageExposureRate = allSummary.exposureSuccessRate;
        allSummary.exposureStatsData = [
            { name: "노출됨", value: allSummary.exposedKeywords },
            { name: "노출 안됨", value: allSummary.notExposedKeywords },
            { name: "URL 없음", value: allSummary.noUrlKeywords + (allSummary.totalKeywords - allSummary.keywordsWithUrls - allSummary.noUrlKeywords) },
        ];


        console.log("Calculated summary for category:", category);
        console.log(`Total execution time: ${Date.now() - startTime}ms`);

        // 요청된 카테고리에 따라 데이터를 필터링하여 반환
        let responseSummary = allSummary;
        let responseCategoryData = categoryStats;

        if (category && category !== 'all' && categoryStats[category]) {
            responseSummary = categoryStats[category];
            responseCategoryData = { [category]: categoryStats[category] }; // 요청된 카테고리만 포함
        } else {
            // 'all'이 요청되었거나 특정 카테고리가 없으면 전체 요약을 반환
            responseSummary = allSummary;
            responseCategoryData = categoryStats; // 모든 카테고리 데이터 반환
        }

        res.status(200).json({
            success: true,
            data: {
                summary: responseSummary, // 특정 카테고리 또는 전체 요약
                categoryData: responseCategoryData, // 모든 카테고리 또는 특정 카테고리 데이터
                allSummary: allSummary, // 항상 전체 요약
                timestamp: new Date().toISOString(),
            },
            executionTime: Date.now() - startTime,
        });

    } catch (error) {
        console.error("Statistics API error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch statistics from Notion",
            error: error.message,
            executionTime: Date.now() - startTime,
        });
    }
}