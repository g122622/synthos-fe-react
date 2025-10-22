import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { DateRangePicker } from "@heroui/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Button as HeroUIButton } from "@heroui/button";
import { MoreVertical } from "lucide-react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Slider } from "@heroui/slider"; // 引入Slider组件

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
    timeStart: number; // 改为 number 以统一时间戳
    timeEnd: number;
    groupId: string; // 添加groupId字段
}

// 创建一个函数来解析contributors字符串为数组
const parseContributors = (contributorsStr: string): string[] => {
    try {
        const parsed = JSON.parse(contributorsStr);

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("解析参与者失败:", error);

        return [];
    }
};

// 创建一个函数为每个参与者生成专属颜色
const generateColorFromName = (name: string, shouldContainAlpha: boolean = true): string => {
    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // 将哈希值转换为HSL颜色值，增加透明度(0.7)
    const hue = Math.abs(hash % 360);

    if (!shouldContainAlpha) {
        return `hsl(${hue}, 70%, 40%)`;
    }

    return `hsla(${hue}, 70%, 40%, 0.1)`;
};

// 创建一个组件来渲染带有高亮的详情文本
const HighlightedDetail: React.FC<{ detail: string; contributors: string[] }> = ({ detail, contributors }) => {
    if (!detail) return <div className="text-default-700 mb-3">摘要正文为空，无法加载数据 😭😭😭</div>;

    // 创建正则表达式来匹配所有参与者名称
    const highlightText = (text: string, names: string[]): React.ReactNode[] => {
        if (names.length === 0) {
            return [text];
        }

        // 转义特殊字符并创建正则表达式
        const escapedNames = names.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
        const regex = new RegExp(`(${escapedNames.join("|")})`, "g");
        const parts = text.split(regex);

        return parts.map((part, index) => {
            // 检查这个部分是否是参与者名称
            const contributorIndex = names.indexOf(part);

            if (contributorIndex !== -1) {
                return (
                    <Chip
                        key={index}
                        className="mx-1"
                        size="sm"
                        style={{
                            backgroundColor: generateColorFromName(part),
                            color: generateColorFromName(part, false),
                            fontWeight: "bold"
                        }}
                        variant="flat"
                    >
                        {part}
                    </Chip>
                );
            }

            return part;
        });
    };

    return <div className="text-default-700 mb-3">{highlightText(detail, contributors)}</div>;
};

export default function LatestTopicsPage() {
    const [topics, setTopics] = useState<TopicItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const [topicsPerPage, setTopicsPerPage] = useState<number>(6); // 将topicsPerPage改为状态

    // 默认时间范围：最近7天
    const [dateRange, setDateRange] = useState({
        start: today(getLocalTimeZone()).subtract({ days: 7 }),
        end: today(getLocalTimeZone())
    });

    // 获取最新话题数据（带时间范围）
    const fetchLatestTopics = async (start: Date, end: Date) => {
        setLoading(true);
        try {
            const groupResponse = await getGroupDetails();

            if (!groupResponse.success) {
                console.error("获取群组信息失败:", groupResponse.message);
                setLoading(false);

                return;
            }

            const groupIds = Object.keys(groupResponse.data);
            const startTime = start.getTime();
            const endTime = end.getTime();

            let allSessionIds: { sessionId: string; groupId: string }[] = []; // 修改类型以包含groupId

            for (const groupId of groupIds) {
                try {
                    const sessionResponse = await getSessionIdsByGroupIdAndTimeRange(groupId, startTime, endTime);

                    if (sessionResponse.success) {
                        // 为每个sessionId关联groupId
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

            const sessionWithDuration: { sessionId: string; timeStart: number; timeEnd: number; groupId: string }[] =
                [];

            for (const { sessionId, groupId } of allSessionIds) {
                try {
                    const timeResponse = await getSessionTimeDuration(sessionId);

                    if (timeResponse.success) {
                        sessionWithDuration.push({
                            sessionId,
                            timeStart: timeResponse.data.timeStart,
                            timeEnd: timeResponse.data.timeEnd,
                            groupId // 添加groupId
                        });
                    }
                } catch (error) {
                    console.error(`获取会话 ${sessionId} 的时间信息失败:`, error);
                }
            }

            sessionWithDuration.sort((a, b) => b.timeEnd - a.timeEnd);

            const allTopics: TopicItem[] = [];

            for (const { sessionId, timeStart, timeEnd, groupId } of sessionWithDuration) {
                // 跳过不在当前筛选时间范围内的会话（可选，根据业务需求）
                if (timeEnd < startTime || timeStart > endTime) continue;

                try {
                    const digestResponse = await getAIDigestResultsBySessionId(sessionId);

                    if (digestResponse.success) {
                        const topicsWithTime = digestResponse.data.map(topic => ({
                            ...topic,
                            timeStart,
                            timeEnd,
                            groupId // 添加groupId
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

    // 初始加载 + 日期变化时重新加载
    useEffect(() => {
        const start = dateRange.start.toDate(getLocalTimeZone());
        const end = dateRange.end.toDate(getLocalTimeZone());

        fetchLatestTopics(start, end);
    }, [dateRange]);

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
                    <CardHeader className="flex flex-col md:flex-row justify-between items-center pl-7 pr-7 gap-4">
                        <h2 className="text-xl font-bold">话题列表</h2>

                        {/* 控制每页显示数量的Slider */}
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="text-default-600 text-sm w-30">每页显示:</div>
                                <Slider
                                    aria-label="每页显示话题数量"
                                    className="max-w-[120px]"
                                    color="primary"
                                    defaultValue={6}
                                    maxValue={12}
                                    minValue={3}
                                    showTooltip={true}
                                    size="lg"
                                    step={3}
                                    value={topicsPerPage}
                                    onChange={setTopicsPerPage}
                                />
                                <span className="text-default-900 text-sm w-6">{topicsPerPage}</span>
                            </div>

                            {/* 日期选择器 + 刷新按钮 */}
                            <div className="flex gap-3 items-center">
                                <DateRangePicker
                                    className="max-w-xs"
                                    label="时间范围"
                                    value={dateRange}
                                    onChange={range => {
                                        if (range) {
                                            setDateRange({
                                                start: range.start,
                                                end: range.end
                                            });
                                        }
                                    }}
                                />
                                <Button
                                    color="primary"
                                    isLoading={loading}
                                    variant="flat"
                                    onPress={() => {
                                        const start = dateRange.start.toDate(getLocalTimeZone());
                                        const end = dateRange.end.toDate(getLocalTimeZone());

                                        fetchLatestTopics(start, end);
                                    }}
                                >
                                    刷新
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardBody>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spinner size="lg" />
                            </div>
                        ) : currentTopics.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                <ScrollShadow className="max-h-[900px]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                                        {currentTopics.map((topic, index) => {
                                            // 解析参与者
                                            const contributorsArray = parseContributors(topic.contributors);

                                            return (
                                                <Card
                                                    key={`${topic.topicId}-${index}`}
                                                    className="border border-default-200"
                                                >
                                                    <CardHeader className="flex flex-col gap-2">
                                                        <div className="flex justify-between items-start">
                                                            <h3 className="text-lg font-bold">{topic.topic}</h3>
                                                        </div>
                                                        <div className="text-default-500 text-sm">
                                                            <Chip className="mr-1" size="sm" variant="flat">
                                                                🕗
                                                                {new Date(topic.timeStart).toLocaleDateString("zh-CN", {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit"
                                                                })}
                                                            </Chip>
                                                            ➡️
                                                            <Chip className="ml-1" size="sm" variant="flat">
                                                                🕗
                                                                {new Date(topic.timeEnd).toLocaleDateString("zh-CN", {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit"
                                                                })}
                                                            </Chip>
                                                        </div>
                                                    </CardHeader>
                                                    <CardBody className="relative pb-9">
                                                        <HighlightedDetail
                                                            contributors={contributorsArray}
                                                            detail={topic.detail}
                                                        />
                                                        {/* 在左下角添加群ID的Chip和群头像 */}
                                                        <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                                            <img
                                                                src={`http://p.qlogo.cn/gh/${topic.groupId}/${topic.groupId}/0`}
                                                                alt="群头像"
                                                                className="w-6 h-6 rounded-full"
                                                                onError={e => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.onerror = null;
                                                                    target.src =
                                                                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
                                                                }}
                                                            />
                                                            <Chip size="sm" variant="flat">
                                                                群ID: {topic.groupId}
                                                            </Chip>
                                                        </div>
                                                        <div className="absolute bottom-3 right-3">
                                                            <Dropdown>
                                                                <DropdownTrigger>
                                                                    <HeroUIButton isIconOnly size="sm" variant="light">
                                                                        <MoreVertical size={16} />
                                                                    </HeroUIButton>
                                                                </DropdownTrigger>
                                                                <DropdownMenu aria-label="更多选项">
                                                                    <DropdownItem key="participants" textValue="参与者">
                                                                        <div className="flex flex-col gap-1">
                                                                            <p className="font-medium">参与者</p>
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {contributorsArray.map(
                                                                                    (contributor, idx) => (
                                                                                        <Chip
                                                                                            key={idx}
                                                                                            size="sm"
                                                                                            variant="flat"
                                                                                            style={{
                                                                                                backgroundColor:
                                                                                                    generateColorFromName(
                                                                                                        contributor
                                                                                                    ),
                                                                                                color: generateColorFromName(
                                                                                                    contributor,
                                                                                                    false
                                                                                                ),
                                                                                                fontWeight: "bold"
                                                                                            }}
                                                                                        >
                                                                                            {contributor}
                                                                                        </Chip>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </DropdownItem>
                                                                    <DropdownItem key="topicId" textValue="话题ID">
                                                                        <div className="flex flex-col gap-1">
                                                                            <p className="font-medium">话题ID</p>
                                                                            <p className="text-sm">{topic.topicId}</p>
                                                                        </div>
                                                                    </DropdownItem>
                                                                    <DropdownItem key="sessionId" textValue="会话ID">
                                                                        <div className="flex flex-col gap-1">
                                                                            <p className="font-medium">会话ID</p>
                                                                            <p className="text-sm">{topic.sessionId}</p>
                                                                        </div>
                                                                    </DropdownItem>
                                                                    <DropdownItem key="groupId" textValue="群ID">
                                                                        <div className="flex flex-col gap-1">
                                                                            <p className="font-medium">群ID</p>
                                                                            <p className="text-sm">{topic.groupId}</p>
                                                                        </div>
                                                                    </DropdownItem>
                                                                </DropdownMenu>
                                                            </Dropdown>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </ScrollShadow>

                                {totalPages > 1 && (
                                    <div className="flex justify-center mt-4">
                                        <Pagination
                                            showControls
                                            color="primary"
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
                                <Button
                                    className="mt-4"
                                    color="primary"
                                    variant="light"
                                    onPress={() => {
                                        const start = dateRange.start.toDate(getLocalTimeZone());
                                        const end = dateRange.end.toDate(getLocalTimeZone());

                                        fetchLatestTopics(start, end);
                                    }}
                                >
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
