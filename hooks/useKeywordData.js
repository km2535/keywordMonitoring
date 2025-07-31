// km2535/keywordmonitoring/keywordMonitoring-8c41bec05c035d38efa4883755f1f3bcf44c30e1/hooks/useKeywordData.js
import { useEffect, useState, useCallback, useRef } from "react";

const useKeywordData = () => {
    const [data, setData] = useState(null);
    const [rawData, setRawData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState("all"); // 초기값은 'all'
    const [categories, setCategories] = useState({}); // 'all' 카테고리 포함

    const loadingRef = useRef(false);
    const abortControllerRef = useRef(null);

    // Categories 로드 함수 - 이제 고정된 'all' 카테고리만 반환
    const loadCategories = useCallback(async () => {
        try {
            console.log("Loading categories (dynamic 'R' values from Notion)...");
            
            const response = await fetch("/api/categories");
            const result = await response.json();

            console.log("Categories API response:", result);

            if (result.success && result.data) {
                const categoriesMap = {};
                result.data.forEach((cat) => {
                    categoriesMap[cat.id] = {
                        id: cat.id,
                        name: cat.name,
                        display_name: cat.display_name,
                    };
                });
                console.log("Categories loaded successfully:", Object.keys(categoriesMap).length);
                setCategories(categoriesMap);
                return categoriesMap;
            } else {
                console.warn("Categories API failed, using default 'all' category");
                const defaultCategories = {
                    all: { id: "all", name: "전체 키워드", display_name: "전체 키워드" },
                };
                setCategories(defaultCategories);
                return defaultCategories;
            }
        } catch (err) {
            console.error("Error loading categories:", err);
            const defaultCategories = {
                all: { id: "all", name: "전체 키워드", display_name: "전체 키워드" },
            };
            setCategories(defaultCategories);
            return defaultCategories;
        }
    }, []);

    // 데이터 로드 함수 - activeCategory에 따라 동적으로 필터링
    const loadData = useCallback(async (categoryToLoad) => {
        if (loadingRef.current) {
            console.log("Data already loading, skipping...");
            return;
        }

        console.log(`Starting to load data for category: "${categoryToLoad}"`); // 로깅 메시지 변경
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            const timeoutId = setTimeout(() => {
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
            }, 30000);

            console.log("Making API requests to Notion-based APIs...");
            
            // 여기서 categoryToLoad 변수를 사용하여 API 요청을 보냅니다.
            const [keywordsResponse, statsResponse] = await Promise.all([
                fetch(`/api/keywords?category=${categoryToLoad}`, { // 수정됨
                    signal: abortControllerRef.current.signal
                }),
                fetch(`/api/statistics?category=${categoryToLoad}`, { // 수정됨
                    signal: abortControllerRef.current.signal
                })
            ]);

            clearTimeout(timeoutId);

            if (!keywordsResponse.ok) {
                throw new Error(`Keywords API error: ${keywordsResponse.status}`);
            }
            if (!statsResponse.ok) {
                throw new Error(`Statistics API error: ${statsResponse.status}`);
            }

            const keywordsResult = await keywordsResponse.json();
            const statsResult = await statsResponse.json();

            console.log("API responses received successfully from Notion-based APIs");

            if (!keywordsResult.success) {
                throw new Error(keywordsResult.message || "Failed to load keywords");
            }

            if (!statsResult.success) {
                throw new Error(statsResult.message || "Failed to load statistics");
            }

            const keywordsData = (keywordsResult.data || []).map((item) => ({
                id: item.id,
                keyword: item.keyword,
                category: item.category,
                categoryName: item.categoryName,
                priority: item.priority,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                totalUrls: item.totalUrls,
                exposedUrls: item.exposedUrls,
                hiddenUrls: item.hiddenUrls,
                unknownUrls: item.unknownUrls,
                exposureStatus: item.exposureStatus,
                exposureRate: item.exposureRate,
                hasExposedUrl: item.hasExposedUrl,
                scannedAt: item.scannedAt,
                urls: item.urls || [],
            }));

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
                ...statsResult.data?.summary, // statsResult.data.summary는 이미 요청된 카테고리에 대한 요약
            };

            const processedData = {
                keywordsData,
                summary,
                timestamp: keywordsResult.timestamp || new Date().toISOString(),
            };

            const processedRawData = {
                allKeywordsData: keywordsData, // 이 부분은 실제 데이터가 필터링되었을 수 있으므로 주의 필요.
                                                // rawData가 전체 데이터를 원한다면 loadData를 2번 호출하거나
                                                // /api/keywords?category=all 요청을 별도로 해야 합니다.
                                                // 현재는 filter된 데이터가 rawData로 들어갈 수 있음
                allSummary: statsResult.data?.allSummary || summary, // statistics API에서 온 allSummary 사용
                categoryData: statsResult.data?.categoryData || {}, 
                timestamps: { [categoryToLoad]: keywordsResult.timestamp }, 
            };

            console.log("Data processing completed successfully for Notion data.");
            setData(processedData);
            setRawData(processedRawData);

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request was aborted');
                return;
            }
            
            console.error("Error loading data from Notion:", error);
            setError(`데이터 로딩 실패: ${error.message}`);
        } finally {
            loadingRef.current = false;
            setLoading(false);
            console.log("Data loading completed from Notion.");
        }
    }, []);

    // 초기 데이터 로드 (컴포넌트 마운트 시 한 번만)
    useEffect(() => {
        console.log("Component mounted, loading categories and initial data...");
        
        const initializeData = async () => {
            try {
                const loadedCategories = await loadCategories();
                if (loadedCategories && Object.keys(loadedCategories).length > 0) {
                    console.log("Categories loaded, now loading initial data...");
                    // 초기 로드시 activeCategory (기본 'all') 값을 사용하여 데이터 로드
                    await loadData(activeCategory); 
                } else {
                    console.log("No categories loaded, setting error state");
                    setError("카테고리를 불러올 수 없습니다.");
                    setLoading(false);
                }
            } catch (error) {
                console.error("Initialization error:", error);
                setError("초기화 중 오류가 발생했습니다.");
                setLoading(false);
            }
        };

        initializeData();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            loadingRef.current = false;
        };
    }, []); 

    // activeCategory가 변경될 때 데이터 로드
    useEffect(() => {
        if (Object.keys(categories).length > 0 && !loading && data) { // `data`가 로드된 후에만
            console.log(`Active category changed to: ${activeCategory}, re-loading data...`);
            
            const timer = setTimeout(() => {
                loadData(activeCategory); // activeCategory 값으로 다시 데이터 로드
            }, 100); 

            return () => clearTimeout(timer);
        }
    }, [activeCategory, categories, loadData]); 

    const getFilteredData = () => {
        if (!data) {
            return null;
        }

        // data.keywordsData는 이미 API에서 필터링되어 온 데이터입니다.
        return {
            keywordsData: data.keywordsData || [],
            summary: data.summary,
            timestamp: data.timestamp,
            categories: Object.keys(categories).map((id) => ({
                id,
                name: categories[id].name,
                display_name: categories[id].display_name,
            })),
        };
    };

    const filteredData = getFilteredData();

    const refreshData = useCallback(() => {
        if (!loadingRef.current) {
            console.log("Manual refresh triggered");
            loadData(activeCategory); // 현재 activeCategory 값으로 새로고침
        }
    }, [loadData, activeCategory]); 

    return {
        data: filteredData,
        rawData,
        loading,
        error,
        activeCategory,
        setActiveCategory,
        categories,
        refreshData,
    };
};

export default useKeywordData;