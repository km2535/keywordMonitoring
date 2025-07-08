import { useEffect, useState } from "react";

const useKeywordData = () => {
    const [data, setData] = useState(null);
    const [rawData, setRawData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState("all");
    const [categories, setCategories] = useState({});

    // Fetch categories
    useEffect(() => {
        const loadCategories = async () => {
            try {
                console.log("Loading categories...");
                const response = await fetch("/api/categories");
                const result = await response.json();

                console.log("Categories API response:", result);

                if (result.success && result.data) {
                    const categoriesMap = {};
                    result.data.forEach((cat) => {
                        // cat.name을 키로 사용하되, 표시명은 display_name 사용
                        categoriesMap[cat.name] = {
                            id: cat.name,
                            name: cat.display_name,
                            originalName: cat.name,
                        };
                    });
                    console.log("Categories map:", categoriesMap);
                    setCategories(categoriesMap);
                } else {
                    console.warn("Categories API failed or returned no data:", result);
                    // Set default categories if API fails
                    setCategories({
                        cancer: { id: "cancer", name: "암 관련", originalName: "cancer" },
                        diabetes: { id: "diabetes", name: "당뇨 관련", originalName: "diabetes" },
                        beauty: { id: "beauty", name: "미용 관련", originalName: "beauty" },
                    });
                }
            } catch (err) {
                console.error("Error loading categories:", err);
                // Set default categories if API fails
                setCategories({
                    cancer: { id: "cancer", name: "암 관련", originalName: "cancer" },
                    diabetes: { id: "diabetes", name: "당뇨 관련", originalName: "diabetes" },
                    beauty: { id: "beauty", name: "미용 관련", originalName: "beauty" },
                });
            }
        };

        loadCategories();
    }, []);

    // Fetch data when category changes
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log("Loading data for category:", activeCategory);

                // Fetch keywords and statistics in parallel
                const [keywordsResponse, statsResponse] = await Promise.all([
                    fetch(`/api/keywords?category=${activeCategory}`),
                    fetch(`/api/statistics?category=${activeCategory}`),
                ]);

                console.log("API responses received");

                const keywordsResult = await keywordsResponse.json();
                const statsResult = await statsResponse.json();

                console.log("Keywords result:", keywordsResult);
                console.log("Stats result:", statsResult);

                if (!keywordsResult.success) {
                    throw new Error(
                        keywordsResult.message || "Failed to load keywords"
                    );
                }

                if (!statsResult.success) {
                    throw new Error(
                        statsResult.message || "Failed to load statistics"
                    );
                }

                // Process and combine the data
                const keywordsData = (keywordsResult.data || []).map((item) => ({
                    keyword: item.keyword || "",
                    category: item.category || "",
                    totalUrls: item.totalUrls || 0,
                    exposureStatus: item.exposureStatus || "미확인",
                    hasExposedUrl: item.hasExposedUrl || false,
                    exposedUrls: item.exposedUrls || 0,
                    hiddenUrls: item.hiddenUrls || 0,
                    unknownUrls: item.unknownUrls || 0,
                    exposureRate: item.exposureRate || 0,
                    scannedAt: item.scannedAt,
                    urls: item.urls || [],
                }));

                console.log("Processed keywords data:", keywordsData);

                // Ensure summary has default values
                const summary = {
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
                    ...statsResult.data?.summary,
                };

                console.log("Final summary:", summary);

                const processedData = {
                    keywordsData,
                    summary,
                    timestamp: keywordsResult.timestamp || new Date().toISOString(),
                };

                // 전체 데이터와 카테고리별 데이터를 구분해서 저장
                let processedRawData;
                if (activeCategory === "all") {
                    processedRawData = {
                        allKeywordsData: keywordsData,
                        allSummary: summary,
                        categoryData: statsResult.data?.categoryData || {},
                        timestamps: { [activeCategory]: keywordsResult.timestamp },
                    };
                } else {
                    // 개별 카테고리의 경우 기존 rawData 유지하면서 현재 카테고리 데이터만 업데이트
                    processedRawData = rawData || {
                        allKeywordsData: [],
                        allSummary: {},
                        categoryData: {},
                        timestamps: {},
                    };
                    processedRawData.categoryData[activeCategory] = { summary };
                    processedRawData.timestamps[activeCategory] = keywordsResult.timestamp;
                }

                console.log("Setting processed data:", processedData);
                console.log("Setting raw data:", processedRawData);

                setData(processedData);
                setRawData(processedRawData);
                setLoading(false);
            } catch (error) {
                console.error("데이터 로딩 중 오류 발생:", error);
                setError(
                    "데이터를 불러오는 중 오류가 발생했습니다: " + error.message
                );
                setLoading(false);
            }
        };

        if (Object.keys(categories).length > 0) {
            loadData();
        }
    }, [activeCategory, categories]);

    // Get data filtered by the active category
    const getFilteredData = () => {
        if (!data) {
            console.log("No data available");
            return null;
        }

        // activeCategory에 따라 적절한 데이터 반환
        const result = {
            keywordsData: data.keywordsData || [],
            summary: data.summary || {
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
            },
            timestamp: data.timestamp,
            categories: Object.keys(categories).map((id) => ({
                id,
                name: categories[id].name,
            })),
        };

        console.log("Filtered data for category", activeCategory, ":", result);
        return result;
    };

    const filteredData = getFilteredData();

    return {
        data: filteredData,
        rawData,
        loading,
        error,
        activeCategory,
        setActiveCategory,
        categories,
    };
};

export default useKeywordData;