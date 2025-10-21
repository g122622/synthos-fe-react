import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import { ScrollShadow } from "@heroui/scroll-shadow";

import {
    getGroupDetails,
    getSessionIdsByGroupIdAndTimeRange,
    getSessionTimeDuration,
    getAIDigestResultsBySessionId
} from "@/services/api";
import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

interface TopicItem {
    topicId: string;
    sessionId: string;
    topic: string;
    contributors: string;
    detail: string;
    timeStart: string;
    timeEnd: number; // 用于排序
}

export default function LatestTopicsPage() {
    const [topics, setTopics] = useState<TopicItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const topicsPerPage = 10;

    // 获取最新话题数据
    const fetchLatestTopics = async () => {
        setLoading(true);
        try {
            // 1. 获取所有群组
            const groupResponse = await getGroupDetails();

            if (!groupResponse.success) {
                console.error("获取群组信息失败:", groupResponse.message);
                setLoading(false);

                return;
            }

            const groupIds = Object.keys(groupResponse.data);
            const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000; // 一周前的时间戳

            // 2. 对所有群组调用getSessionIdsByGroupIdAndTimeRange获取sessionId
            let allSessionIds: string[] = [];

            for (const groupId of groupIds) {
                try {
                    const sessionResponse = await getSessionIdsByGroupIdAndTimeRange(groupId, oneWeekAgo, Date.now());

                    if (sessionResponse.success) {
                        allSessionIds = [...allSessionIds, ...sessionResponse.data];
                    }
                } catch (error) {
                    console.error(`获取群组 ${groupId} 的会话ID失败:`, error);
                }
            }

            // 3. 使用getSessionTimeDuration按照结束时间进行排名
            const sessionWithDuration: { sessionId: string; timeStart: number; timeEnd: number }[] = [];

            for (const sessionId of allSessionIds) {
                try {
                    const timeResponse = await getSessionTimeDuration(sessionId);

                    if (timeResponse.success) {
                        sessionWithDuration.push({
                            sessionId,
                            timeStart: timeResponse.data.timeStart,
                            timeEnd: timeResponse.data.timeEnd
                        });
                    }
                } catch (error) {
                    console.error(`获取会话 ${sessionId} 的时间信息失败:`, error);
                }
            }

            // 按结束时间降序排序
            sessionWithDuration.sort((a, b) => b.timeEnd - a.timeEnd);

            // 4. 使用getAIDigestResultsBySessionId获取AI摘要结果
            const allTopics: TopicItem[] = [];

            for (const { sessionId, timeStart, timeEnd } of sessionWithDuration) {
                try {
                    const digestResponse = await getAIDigestResultsBySessionId(sessionId);

                    if (digestResponse.success) {
                        // 为每个摘要结果添加时间信息
                        const topicsWithTime = digestResponse.data.map(topic => ({
                            ...topic,
                            timeStart,
                            timeEnd
                        }));

                        allTopics.push(...topicsWithTime);
                    }
                } catch (error) {
                    console.error(`获取会话 ${sessionId} 的摘要结果失败:`, error);
                }
            }

            setTopics(allTopics);
        } catch (error) {
            console.error("获取最新话题失败:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLatestTopics();
    }, []);

    // 分页处理
    const totalPages = Math.ceil(topics.length / topicsPerPage);
    const currentTopics = topics.slice((page - 1) * topicsPerPage, page * topicsPerPage);

    return (
        <DefaultLayout>
            <section className="flex flex-col gap-4 py-8 md:py-10">
                <div className="flex flex-col items-center justify-center gap-4">
                    <h1 className={title()}>最新话题</h1>
                    <p className="text-default-600 max-w-2xl text-center">按时间排序的最新聊天话题摘要</p>
                </div>

                <Card className="mt-6">
                    <CardHeader className="flex flex-row justify-between items-center p-5">
                        <h2 className="text-xl font-bold">话题列表</h2>
                        <Button color="primary" isLoading={loading} variant="flat" onPress={fetchLatestTopics}>
                            {"刷新"}
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spinner size="lg" />
                            </div>
                        ) : currentTopics.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                <ScrollShadow className="max-h-[600px]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {currentTopics.map((topic, index) => (
                                            <Card
                                                key={`${topic.topicId}-${index}`}
                                                className="border border-default-200"
                                            >
                                                <CardHeader className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="text-lg font-bold">{topic.topic}</h3>
                                                    </div>
                                                    <p className="text-default-500 text-sm">
                                                        <Chip size="sm" variant="flat" className="mr-1">
                                                            {new Date(topic.timeStart).toLocaleDateString("zh-CN", {
                                                                month: "short",
                                                                day: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit"
                                                            })}
                                                        </Chip>
                                                        to
                                                        <Chip size="sm" variant="flat" className="ml-1">
                                                            {new Date(topic.timeEnd).toLocaleDateString("zh-CN", {
                                                                month: "short",
                                                                day: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit"
                                                            })}
                                                        </Chip>
                                                    </p>
                                                </CardHeader>
                                                <CardBody>
                                                    <p className="text-default-700 mb-3">{topic.detail}</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Chip size="sm" variant="flat">
                                                            参与者: {topic.contributors}
                                                        </Chip>
                                                        <Chip color="primary" size="sm" variant="flat">
                                                            ID: {topic.topicId.slice(0, 8)}...
                                                        </Chip>
                                                        <Chip size="sm" variant="flat">
                                                            会话ID: {topic.sessionId}
                                                        </Chip>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollShadow>

                                {totalPages > 1 && (
                                    <div className="flex justify-center mt-4">
                                        <Pagination
                                            showControls
                                            color="primary"
                                            initialPage={1}
                                            page={page}
                                            size="md"
                                            total={totalPages}
                                            onChange={setPage}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-default-500">暂无话题数据</p>
                                <Button className="mt-4" color="primary" variant="light" onPress={fetchLatestTopics}>
                                    重新加载
                                </Button>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </section>
        </DefaultLayout>
    );
}
