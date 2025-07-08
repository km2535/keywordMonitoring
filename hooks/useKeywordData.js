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
                const response = await fetch("/api/categories");
                const result = await response.json();

                if (result.success) {
                    const categoriesMap = {};
                    result.data.forEach((cat) => {
                        categoriesMap[cat.id] = {
                            id: cat.id,
                            name: cat.name,
                        };
                    });
                    setCategories(categoriesMap);
                } else {
                    throw new Error(
                        result.message || "Failed to load categories"
                    );
                }
            } catch (err) {
                console.error("Error loading categories:", err);
                // Set default categories if API fails
                setCategories({
                    cancer: { id: "cancer", name: "암" },
                    diabetes: { id: "diabetes", name: "당뇨" },
                    cosmetics: { id: "cosmetics", name: "갱년기" },
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

                // Fetch keywords and statistics in parallel
                const [keywordsResponse, statsResponse] = await Promise.all([
                    fetch(`/api/keywords?category=${activeCategory}`),
                    fetch(`/api/statistics?category=${activeCategory}`),
                ]);

                const keywordsResult = await keywordsResponse.json();
                const statsResult = await statsResponse.json();

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
                const keywordsData = keywordsResult.data.map((item) => ({
                    keyword: item.keyword,
                    category: item.category,
                    totalUrls: item.totalUrls,
                    exposureStatus: item.exposureStatus,
                    hasExposedUrl: item.hasExposedUrl,
                    urls: item.urls || [],
                }));

                const processedData = {
                    keywordsData,
                    summary: statsResult.data.summary,
                    timestamp: keywordsResult.timestamp,
                };

                const processedRawData = {
                    allKeywordsData: keywordsData,
                    allSummary: statsResult.data.allSummary,
                    categoryData: statsResult.data.categoryData || {},
                    timestamps: { [activeCategory]: keywordsResult.timestamp },
                };

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
        if (!data || !rawData) return null;

        if (activeCategory === "all") {
            return {
                keywordsData: rawData.allKeywordsData || [],
                summary: rawData.allSummary || data.summary,
                timestamp: data.timestamp,
                categories: Object.keys(categories).map((id) => ({
                    id,
                    name: categories[id].name,
                })),
            };
        }

        return {
            keywordsData: data.keywordsData || [],
            summary: data.summary,
            timestamp: data.timestamp,
            categories: Object.keys(categories).map((id) => ({
                id,
                name: categories[id].name,
            })),
        };
    };

    return {
        data: getFilteredData(),
        rawData,
        loading,
        error,
        activeCategory,
        setActiveCategory,
        categories,
    };
};

export default useKeywordData;
