import { useState, useEffect, useCallback } from "react";
import { getGroupDetails, getSessionIdsByGroupIdAndTimeRange, getSessionTimeDuration, getAIDigestResultsBySessionId } from "@/services/api";
import { getInterestScoreResult, isInterestScoreResultExist } from "@/services/interestScoreApi";
import { TopicItem } from "@/types/topic";
import { TopicReadStatusManager } from "@/util/TopicReadStatusManager";

export function useTopicsData() {
    const [topics, setTopics] = useState<TopicItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [interestScores, setInterestScores] = useState<Record<string, number>>({});

    /**
     * 获取话题兴趣分数
     */
    const fetchInterestScore = useCallback(async (topic: TopicItem): Promise<number | null> => {
        try {
            const existsResponse = await isInterestScoreResultExist(topic.topicId);

            if (existsResponse.success && existsResponse.data) {
                const scoreResponse = await getInterestScoreResult(topic.topicId);

                if (scoreResponse.success) {
                    return scoreResponse.data;
                }

                return null;
            }

            return null;
        } catch (error) {
            console.error("获取话题兴趣得分失败:", error);
            return null;
        }
    }, []);

    /**
     * 获取最新话题
     */
    const fetchLatestTopics = useCallback(
        async (startDate: Date, endDate: Date) => {
            setLoading(true);
            setError(null);

            try {
                const readStatusManager = TopicReadStatusManager.getInstance();
                const readStatuses = await readStatusManager.getAllReadStatuses();

                const groupResponse = await getGroupDetails();

                if (!groupResponse.success) {
                    console.error("获取群组信息失败:", groupResponse.message);
                    setError("获取群组信息失败");
                    return;
                }

                const groupIds = Object.keys(groupResponse.data);
                const startTime = startDate.getTime();
                const endTime = endDate.getTime();

                let allSessionIds: { sessionId: string; groupId: string }[] = [];

                for (const groupId of groupIds) {
                    try {
                        const sessionResponse = await getSessionIdsByGroupIdAndTimeRange(groupId, startTime, endTime);

                        if (sessionResponse.success) {
                            const sessionsWithGroupId = sessionResponse.data.map(sessionId => ({
                                sessionId,
                                groupId
                            }));

                            allSessionIds = [...allSessionIds, ...sessionsWithGroupId];
                        }
                    } catch (error) {
                        console.error(`获取群组 ${groupId} 的会话ID失败:`, error);
                    }
                }

                const sessionWithDuration: { sessionId: string; timeStart: number; timeEnd: number; groupId: string }[] = [];

                for (const { sessionId, groupId } of allSessionIds) {
                    try {
                        const timeResponse = await getSessionTimeDuration(sessionId);

                        if (timeResponse.success) {
                            sessionWithDuration.push({
                                sessionId,
                                timeStart: timeResponse.data.timeStart,
                                timeEnd: timeResponse.data.timeEnd,
                                groupId
                            });
                        }
                    } catch (error) {
                        console.error(`获取会话 ${sessionId} 的时间信息失败:`, error);
                    }
                }

                sessionWithDuration.sort((a, b) => b.timeEnd - a.timeEnd);

                const allTopics: TopicItem[] = [];

                for (const { sessionId, timeStart, timeEnd, groupId } of sessionWithDuration) {
                    if (timeEnd < startTime || timeStart > endTime) continue;

                    try {
                        const digestResponse = await getAIDigestResultsBySessionId(sessionId);

                        if (digestResponse.success) {
                            const topicsWithTime = digestResponse.data.map(topic => ({
                                ...topic,
                                timeStart,
                                timeEnd,
                                groupId
                            }));

                            allTopics.push(...topicsWithTime);
                        }
                    } catch (error) {
                        console.error(`获取会话 ${sessionId} 的摘要结果失败:`, error);
                    }
                }

                const topicsWithScores = [...allTopics];
                const scoreMap: Record<string, number> = {};

                for (const topic of allTopics) {
                    const score = await fetchInterestScore(topic);

                    if (score) {
                        scoreMap[topic.topicId] = score;
                    }
                }

                setInterestScores(scoreMap);
                setTopics(topicsWithScores);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "获取话题失败";
                setError(errorMessage);
                console.error("Failed to fetch latest topics:", err);
            } finally {
                setLoading(false);
            }
        },
        [fetchInterestScore]
    );

    /**
     * 刷新话题数据
     */
    const refreshTopics = useCallback(
        (startDate: Date, endDate: Date) => {
            return fetchLatestTopics(startDate, endDate);
        },
        [fetchLatestTopics]
    );

    return {
        topics,
        loading,
        error,
        interestScores,
        fetchLatestTopics,
        refreshTopics,
        fetchInterestScore
    };
}
