// hooks/useKeywordData.js - 무한 로딩 해결된 버전
import { useEffect, useState, useCallback, useRef } from "react";

const useKeywordData = () => {
    const [data, setData] = useState(null);
    const [rawData, setRawData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState("all");
    const [categories, setCategories] = useState({});
    
    // 중복 요청 방지를 위한 ref
    const loadingRef = useRef(false);
    const abortControllerRef = useRef(null);
    const categoriesLoadedRef = useRef(false);

    // Categories 로드 함수 - 한 번만 실행되도록 수정
    const loadCategories = useCallback(async () => {
        if (categoriesLoadedRef.current || loadingRef.current) {
            console.log("Categories already loaded or loading, skipping...");
            return;
        }

        try {
            categoriesLoadedRef.current = true;
            console.log("Loading categories...");
            
            const response = await fetch("/api/categories");
            const result = await response.json();

            console.log("Categories API response:", result);

            if (result.success && result.data) {
                const categoriesMap = {};
                result.data.forEach((cat) => {
                    categoriesMap[cat.name] = {
                        id: cat.name,
                        name: cat.display_name,
                        originalName: cat.name,
                    };
                });
                console.log("Categories loaded successfully:", Object.keys(categoriesMap).length);
                setCategories(categoriesMap);
                return categoriesMap;
            } else {
                console.warn("Categories API failed, using defaults");
                const defaultCategories = {
                    cancer: { id: "cancer", name: "암 관련", originalName: "cancer" },
                    diabetes: { id: "diabetes", name: "당뇨 관련", originalName: "diabetes" },
                    beauty: { id: "beauty", name: "미용 관련", originalName: "beauty" },
                };
                setCategories(defaultCategories);
                return defaultCategories;
            }
        } catch (err) {
            console.error("Error loading categories:", err);
            const defaultCategories = {
                cancer: { id: "cancer", name: "암 관련", originalName: "cancer" },
                diabetes: { id: "diabetes", name: "당뇨 관련", originalName: "diabetes" },
                beauty: { id: "beauty", name: "미용 관련", originalName: "beauty" },
            };
            setCategories(defaultCategories);
            return defaultCategories;
        }
    }, []);

    // 데이터 로드 함수 - 명확한 의존성 관리
    const loadData = useCallback(async (categoryToLoad) => {
        if (loadingRef.current) {
            console.log("Data already loading, skipping...");
            return;
        }

        console.log(`Starting to load data for category: ${categoryToLoad}`);
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        // 이전 요청 취소
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            const timeoutId = setTimeout(() => {
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
            }, 30000); // 30초 타임아웃

            console.log("Making API requests...");
            
            const [keywordsResponse, statsResponse] = await Promise.all([
                fetch(`/api/keywords?category=${categoryToLoad}`, {
                    signal: abortControllerRef.current.signal
                }),
                fetch(`/api/statistics?category=${categoryToLoad}`, {
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

            console.log("API responses received successfully");

            if (!keywordsResult.success) {
                throw new Error(keywordsResult.message || "Failed to load keywords");
            }

            if (!statsResult.success) {
                throw new Error(statsResult.message || "Failed to load statistics");
            }

            // 데이터 처리
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

            const processedData = {
                keywordsData,
                summary,
                timestamp: keywordsResult.timestamp || new Date().toISOString(),
            };

            // rawData 처리
            let processedRawData;
            if (categoryToLoad === "all") {
                processedRawData = {
                    allKeywordsData: keywordsData,
                    allSummary: summary,
                    categoryData: statsResult.data?.categoryData || {},
                    timestamps: { [categoryToLoad]: keywordsResult.timestamp },
                };
            } else {
                processedRawData = {
                    allKeywordsData: [],
                    allSummary: {},
                    categoryData: { [categoryToLoad]: { summary } },
                    timestamps: { [categoryToLoad]: keywordsResult.timestamp },
                };
            }

            console.log("Data processing completed successfully");
            setData(processedData);
            setRawData(processedRawData);

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request was aborted');
                return;
            }
            
            console.error("Error loading data:", error);
            setError(`데이터 로딩 실패: ${error.message}`);
        } finally {
            loadingRef.current = false;
            setLoading(false);
            console.log("Data loading completed");
        }
    }, []);

    // 초기 카테고리 로드 (컴포넌트 마운트 시 한 번만)
    useEffect(() => {
        console.log("Component mounted, loading categories...");
        
        const initializeData = async () => {
            try {
                const loadedCategories = await loadCategories();
                if (loadedCategories && Object.keys(loadedCategories).length > 0) {
                    console.log("Categories loaded, now loading initial data...");
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

        // 컴포넌트 언마운트 시 정리
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            loadingRef.current = false;
            categoriesLoadedRef.current = false;
        };
    }, []); // 빈 의존성 배열로 한 번만 실행

    // 카테고리 변경 시에만 데이터 로드
    useEffect(() => {
        // 카테고리가 이미 로드되어 있고, 초기 로딩이 완료된 후에만 실행
        if (Object.keys(categories).length > 0 && !loading && categoriesLoadedRef.current) {
            console.log(`Category changed to: ${activeCategory}, loading data...`);
            
            const timer = setTimeout(() => {
                loadData(activeCategory);
            }, 100); // 짧은 디바운싱

            return () => clearTimeout(timer);
        }
    }, [activeCategory, categories, loadData]); // categories가 변경될 때는 실행하지 않음

    // 필터된 데이터 반환
    const getFilteredData = () => {
        if (!data) {
            return null;
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

    const filteredData = getFilteredData();

    // 수동 새로고침 함수
    const refreshData = useCallback(() => {
        if (!loadingRef.current) {
            console.log("Manual refresh triggered");
            loadData(activeCategory);
        }
    }, [activeCategory, loadData]);

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