import React, { useState, useEffect, useMemo } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Pagination } from "@heroui/pagination";
import { Tooltip } from "@heroui/tooltip";
import { addToast } from "@heroui/toast";
import { Check } from "lucide-react";

import DefaultLayout from "../../layouts/default";
import { TopicItem, TopicFilters } from "../../types/topic";
import { DEFAULT_PAGE_SIZE, DEFAULT_DATE_RANGE_DAYS } from "../../constants/defaults";
import { useTopicsData } from "../../hooks/useTopicsData";
import { useTopicFilters } from "../../hooks/useTopicFilters";
import { useTopicStatus } from "../../hooks/useTopicStatus";

import { TopicHeader } from "./components/TopicHeader";
import { TopicFilters as TopicFiltersComponent } from "./components/TopicFilters";
import { TopicCard } from "./components/TopicCard";

const LatestTopicsPage: React.FC = () => {
    // 基础状态
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<TopicFilters>({
        searchQuery: "",
        showOnlyUnread: false,
        showOnlyFavorites: false,
        dateRange: {
            start: new Date(Date.now() - DEFAULT_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000),
            end: new Date()
        },
        interestScoreRange: [0, 10]
    });

    // 使用自定义 hooks
    const { topics, loading, error, interestScores, fetchLatestTopics, refreshTopics } = useTopicsData();
    const { readTopics, favoriteTopics, markAsRead, toggleFavorite, batchMarkAsRead } = useTopicStatus();
    const { filteredTopics, sortedTopics } = useTopicFilters(topics, filters, readTopics, favoriteTopics, interestScores);

    // 计算分页数据
    const totalPages = Math.ceil(sortedTopics.length / DEFAULT_PAGE_SIZE);
    const currentTopics = useMemo(() => {
        const startIndex = (page - 1) * DEFAULT_PAGE_SIZE;
        const endIndex = startIndex + DEFAULT_PAGE_SIZE;

        return sortedTopics.slice(startIndex, endIndex);
    }, [sortedTopics, page]);

    // 初始加载
    useEffect(() => {
        const { start, end } = filters.dateRange;

        fetchLatestTopics(start, end);
    }, []); // 只在组件挂载时执行一次

    // 日期变化时重新加载
    useEffect(() => {
        if (filters.dateRange) {
            const start = filters.dateRange.start;
            const end = filters.dateRange.end;

            fetchLatestTopics(start, end);
        }
    }, [filters.dateRange, fetchLatestTopics]);

    // 筛选条件变化时重新加载数据
    useEffect(() => {
        const { start, end } = filters.dateRange;

        fetchLatestTopics(start, end);
        setPage(1); // 重置页码
    }, [filters.dateRange]);

    // 筛选条件变化时重置页码
    useEffect(() => {
        setPage(1);
    }, [filters.searchQuery, filters.showOnlyUnread, filters.showOnlyFavorites, filters.interestScoreRange]);

    // 处理筛选器变化
    const handleFiltersChange = (newFilters: Partial<TopicFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    // 重置筛选器
    const handleResetFilters = () => {
        setFilters({
            searchQuery: "",
            showOnlyUnread: false,
            showOnlyFavorites: false,
            dateRange: {
                start: new Date(Date.now() - DEFAULT_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000),
                end: new Date()
            },
            interestScoreRange: [0, 10]
        });
    };

    // 处理刷新
    const handleRefresh = () => {
        const { start, end } = filters.dateRange;

        refreshTopics(start, end);
    };

    // 处理话题操作
    const handleMarkAsRead = async (topicId: string) => {
        const result = await markAsRead(topicId);

        addToast({
            title: result.success ? "成功" : "失败",
            description: result.message,
            color: result.success ? "success" : "danger",
            variant: "flat"
        });
    };

    const handleToggleFavorite = async (topicId: string) => {
        const result = await toggleFavorite(topicId);

        addToast({
            title: result.success ? "成功" : "失败",
            description: result.message,
            color: result.success ? "success" : "danger",
            variant: "flat"
        });
    };

    const handleCopy = async (topic: TopicItem) => {
        try {
            const textToCopy = `${topic.groupName}\n${topic.detail}\n时间: ${topic.timeStart} - ${topic.timeEnd}`;

            await navigator.clipboard.writeText(textToCopy);
            addToast({
                title: "复制成功",
                description: "话题内容已复制到剪贴板",
                color: "success",
                variant: "flat"
            });
        } catch (error) {
            addToast({
                title: "复制失败",
                description: "无法复制话题内容",
                color: "danger",
                variant: "flat"
            });
        }
    };

    // 批量标记为已读
    const handleBatchMarkAsRead = async () => {
        const unreadTopics = currentTopics.filter(topic => !readTopics[topic.topicId]);

        if (unreadTopics.length === 0) return;

        const result = await batchMarkAsRead(unreadTopics.map(topic => topic.topicId));

        addToast({
            title: result.success ? "批量标记成功" : "批量标记失败",
            description: result.message,
            color: result.success ? "success" : "danger",
            variant: "flat"
        });
    };

    return (
        <DefaultLayout>
            <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
                <div className="inline-block max-w-lg text-center justify-center">
                    <TopicHeader description="基于 AI 智能分析的兴趣话题推荐" loading={loading} title="最新话题" onRefresh={handleRefresh} />
                </div>

                <div className="w-full max-w-4xl">
                    {/* 筛选器 */}
                    <TopicFiltersComponent filters={filters} onFiltersChange={handleFiltersChange} onReset={handleResetFilters} />

                    {/* 话题列表 */}
                    <Card>
                        <CardBody>
                            {loading ? (
                                <div className="text-center py-12">
                                    <p>加载中...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-12">
                                    <p className="text-danger">{error}</p>
                                    <Button className="mt-4" color="primary" variant="flat" onPress={handleRefresh}>
                                        重新加载
                                    </Button>
                                </div>
                            ) : currentTopics.length > 0 ? (
                                <div className="relative">
                                    <div className="space-y-4">
                                        {currentTopics.map(topic => (
                                            <TopicCard
                                                key={topic.topicId}
                                                interestScores={interestScores}
                                                isFavorite={!!favoriteTopics[topic.topicId]}
                                                isRead={!!readTopics[topic.topicId]}
                                                topic={topic}
                                                onMarkAsRead={() => handleMarkAsRead(topic.topicId)}
                                                onToggleFavorite={() => handleToggleFavorite(topic.topicId)}
                                            />
                                        ))}
                                    </div>

                                    {/* 分页 */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination showControls color="primary" page={page} size="md" total={totalPages} onChange={setPage} />
                                        </div>
                                    )}

                                    {/* 整页已读按钮 */}
                                    {!loading && currentTopics.length > 0 && currentTopics.some(topic => !readTopics[topic.topicId]) && (
                                        <div className="absolute bottom-4 right-4">
                                            <Tooltip color="primary" content="将当前页面所有未读话题标记为已读" placement="top">
                                                <Button color="primary" size="sm" startContent={<Check size={16} />} variant="flat" onPress={handleBatchMarkAsRead}>
                                                    整页已读
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-default-500">暂无话题数据，请调整筛选条件后重试</p>
                                    <Button className="mt-4" color="primary" variant="flat" onPress={handleRefresh}>
                                        重新加载
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </section>
        </DefaultLayout>
    );
};

export default LatestTopicsPage;
