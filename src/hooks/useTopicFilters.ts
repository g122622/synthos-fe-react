import { useMemo } from "react";
import { TopicItem, TopicFilters } from "../types/topic";

export function useTopicFilters(
    topics: TopicItem[],
    filters: TopicFilters,
    readTopics: Record<string, boolean> = {},
    favoriteTopics: Record<string, boolean> = {},
    interestScores?: Record<string, number>
) {
    /**
     * 筛选话题
     */
    const filteredTopics = useMemo(() => {
        return topics.filter(topic => {
            // 搜索筛选
            if (filters.searchQuery) {
                const searchLower = filters.searchQuery.toLowerCase();
                const matchesSearch = topic.detail.toLowerCase().includes(searchLower) || topic.groupName.toLowerCase().includes(searchLower) || topic.groupId.toLowerCase().includes(searchLower);

                if (!matchesSearch) return false;
            }

            // 已读筛选
            if (filters.showOnlyUnread) {
                if (readTopics[topic.topicId]) {
                    return false;
                }
            }

            // 收藏筛选
            if (filters.showOnlyFavorites) {
                if (!favoriteTopics[topic.topicId]) {
                    return false;
                }
            }

            // 日期范围筛选
            const topicStartTime = new Date(topic.timeStart);
            if (topicStartTime < filters.dateRange.start || topicStartTime > filters.dateRange.end) {
                return false;
            }

            // 兴趣分数筛选
            if (filters.interestScoreRange && interestScores) {
                const score = interestScores[topic.topicId];
                if (score !== undefined) {
                    const [minScore, maxScore] = filters.interestScoreRange;
                    if (score < minScore || score > maxScore) {
                        return false;
                    }
                }
            }

            return true;
        });
    }, [topics, filters, readTopics, favoriteTopics, interestScores]);

    /**
     * 排序话题
     */
    const sortedTopics = useMemo(() => {
        return [...filteredTopics].sort((a, b) => {
            // 优先按兴趣分数排序
            if (interestScores) {
                const scoreA = interestScores[a.topicId];
                const scoreB = interestScores[b.topicId];

                if (scoreA !== undefined && scoreB !== undefined) {
                    return scoreB - scoreA; // 降序
                }

                if (scoreA !== undefined && scoreB === undefined) {
                    return -1;
                }

                if (scoreA === undefined && scoreB !== undefined) {
                    return 1;
                }
            }

            // 其次按时间排序
            return new Date(b.timeStart).getTime() - new Date(a.timeStart).getTime();
        });
    }, [filteredTopics, interestScores]);

    return {
        filteredTopics,
        sortedTopics
    };
}
