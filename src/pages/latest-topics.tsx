import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { DateRangePicker, Tooltip, addToast, Input, Checkbox } from "@heroui/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Button as HeroUIButton } from "@heroui/button";
import { MoreVertical, Check, Copy, Search, Star } from "lucide-react";
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
import TopicReadStatusManager from "@/util/TopicReadStatusManager";
import TopicFavoriteStatusManager from "@/util/TopicFavoriteStatusManager";

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
    const [readTopics, setReadTopics] = useState<Record<string, boolean>>({});
    const [favoriteTopics, setFavoriteTopics] = useState<Record<string, boolean>>({}); // 收藏状态

    // 筛选状态
    const [filterRead, setFilterRead] = useState<boolean>(false); // 过滤已读
    const [filterFavorite, setFilterFavorite] = useState<boolean>(false); // 筛选收藏
    const [searchText, setSearchText] = useState<string>(""); // 全文搜索

    // 默认时间范围：最近7天
    const [dateRange, setDateRange] = useState({
        start: today(getLocalTimeZone()).subtract({ days: 3 }),
        end: today(getLocalTimeZone()).add({ days: 1 })
    });

    // 初始化收藏状态管理器
    const favoriteStatusManager = useMemo(() => TopicFavoriteStatusManager.getInstance(), []);

    // 加载收藏状态
    useEffect(() => {
        const loadFavoriteStatus = async () => {
            try {
                const status = await favoriteStatusManager.getAllFavoriteStatus();

                setFavoriteTopics(status);
            } catch (error) {
                console.error("Failed to load favorite status:", error);
            }
        };

        loadFavoriteStatus();
    }, []);

    // 初始化已读状态
    useEffect(() => {
        const initReadStatus = async () => {
            try {
                const readStatusManager = TopicReadStatusManager.getInstance();
                const readStatus = await readStatusManager.getAllReadStatus();

                setReadTopics(readStatus);
            } catch (error) {
                console.error("初始化已读状态失败:", error);
            }
        };

        initReadStatus();
    }, []);

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

    // 当筛选条件改变时，重置页码
    useEffect(() => {
        setPage(1);
    }, [filterRead, filterFavorite, searchText, dateRange]);

    // 应用筛选器
    const filteredTopics = topics.filter(topic => {
        // 过滤已读
        if (filterRead && readTopics[topic.topicId]) {
            return false;
        }

        // 筛选收藏
        if (filterFavorite && !favoriteTopics[topic.topicId]) {
            return false;
        }

        // 全文搜索
        if (searchText) {
            const searchTextLower = searchText.toLowerCase();
            const topicMatch = topic?.topic?.toLowerCase()?.includes(searchTextLower);
            const detailMatch = topic?.detail?.toLowerCase()?.includes(searchTextLower);
            const contributorsArray = parseContributors(topic?.contributors);
            const contributorMatch = contributorsArray.some(contributor =>
                contributor.toLowerCase().includes(searchTextLower)
            );

            return topicMatch || detailMatch || contributorMatch;
        }

        return true;
    });

    // 分页处理
    const totalPages = Math.ceil(filteredTopics.length / topicsPerPage);
    const currentTopics = filteredTopics.slice((page - 1) * topicsPerPage, page * topicsPerPage);

    // 标记话题为已读
    const markAsRead = async (topicId: string) => {
        try {
            // 更新本地状态
            setReadTopics(prev => ({
                ...prev,
                [topicId]: true
            }));

            // 使用TopicReadStatusManager更新IndexedDB
            await TopicReadStatusManager.getInstance().markAsRead(topicId);

            addToast({
                title: "标记成功",
                description: "话题已标记为已读",
                color: "success",
                variant: "flat"
            });
        } catch (error) {
            console.error("Failed to mark topic as read:", error);
            addToast({
                title: "标记失败",
                description: "无法标记话题为已读",
                color: "danger",
                variant: "flat"
            });
        }
    };

    // 切换收藏状态
    const toggleFavorite = async (topicId: string) => {
        try {
            const isCurrentlyFavorite = favoriteTopics[topicId];

            if (isCurrentlyFavorite) {
                // 取消收藏
                await favoriteStatusManager.removeFromFavorites(topicId);
                setFavoriteTopics(prev => ({
                    ...prev,
                    [topicId]: false
                }));
                addToast({
                    title: "取消收藏",
                    description: "话题已从收藏中移除",
                    color: "success",
                    variant: "flat"
                });
            } else {
                // 添加收藏
                await favoriteStatusManager.markAsFavorite(topicId);
                setFavoriteTopics(prev => ({
                    ...prev,
                    [topicId]: true
                }));
                addToast({
                    title: "收藏成功",
                    description: "话题已添加到收藏",
                    color: "success",
                    variant: "flat"
                });
            }
        } catch (error) {
            console.error("Failed to toggle favorite status:", error);
            addToast({
                title: "操作失败",
                description: "无法更新收藏状态",
                color: "danger",
                variant: "flat"
            });
        }
    };

    return (
        <DefaultLayout>
            <section className="flex flex-col gap-4 py-8 md:py-10">
                <div className="flex items-center justify-center">
                    <img alt="logo" className="w-21 mr-5" src="./logo.webp" />
                    <div className="flex flex-col items-center justify-center gap-4">
                        <h1 className={title()}>最新话题</h1>
                        <p className="text-default-600 max-w-2xl text-center">按时间排序的最新聊天话题摘要</p>
                    </div>
                </div>

                <Card className="mt-6">
                    <CardHeader className="flex flex-col md:flex-row justify-between items-center pl-7 pr-7 gap-4">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <h2 className="text-xl font-bold">话题列表</h2>
                            <Input
                                isClearable
                                aria-label="全文搜索"
                                className="max-w-[200px]"
                                placeholder="搜索话题..."
                                startContent={<Search size={16} />}
                                value={searchText}
                                onValueChange={setSearchText}
                            />
                        </div>

                        {/* 顶栏右侧 */}
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            {/* 筛选控件 */}
                            <div className="flex gap-3 items-center">
                                <div className="flex items-center gap-2">
                                    <div className="text-default-600 text-sm w-27">每页显示:</div>
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
                                    <span className="text-default-900 text-sm w-30">{topicsPerPage} 张卡片</span>
                                </div>

                                <Checkbox className="w-100" isSelected={filterRead} onValueChange={setFilterRead}>
                                    过滤已读
                                </Checkbox>

                                <Checkbox
                                    className="w-100"
                                    isSelected={filterFavorite}
                                    onValueChange={setFilterFavorite}
                                >
                                    筛选收藏
                                </Checkbox>

                                {/* 日期选择器 + 刷新按钮 */}
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
                                                            <Tooltip
                                                                color="default"
                                                                content="复制话题内容"
                                                                placement="top"
                                                            >
                                                                <HeroUIButton
                                                                    isIconOnly
                                                                    size="sm"
                                                                    variant="light"
                                                                    onPress={() => {
                                                                        // 复制话题内容到剪贴板
                                                                        const contentToCopy = `话题: ${topic.topic}\n\n参与者: ${contributorsArray.join(", ")}\n\n详情: ${topic.detail}\n\n时间: ${new Date(topic.timeStart).toLocaleString()} - ${new Date(topic.timeEnd).toLocaleString()}\n群ID: ${topic.groupId}\n话题ID: ${topic.topicId}\n会话ID: ${topic.sessionId}`;

                                                                        navigator.clipboard
                                                                            .writeText(contentToCopy)
                                                                            .then(() => {
                                                                                addToast({
                                                                                    title: "已复制到剪贴板",
                                                                                    variant: "flat",
                                                                                    color: "success",
                                                                                    timeout: 2000
                                                                                });
                                                                            })
                                                                            .catch(err => {
                                                                                console.error("复制失败:", err);
                                                                                addToast({
                                                                                    title: "复制失败",
                                                                                    variant: "flat",
                                                                                    color: "danger",
                                                                                    timeout: 2000
                                                                                });
                                                                            });
                                                                    }}
                                                                >
                                                                    <Copy size={16} />
                                                                </HeroUIButton>
                                                            </Tooltip>
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
                                                                alt="群头像"
                                                                className="w-6 h-6 rounded-full"
                                                                src={`http://p.qlogo.cn/gh/${topic.groupId}/${topic.groupId}/0`}
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
                                                        {/* 右下角的更多选项、收藏按钮和已读按钮 */}
                                                        <div className="absolute bottom-3 right-3 flex gap-1">
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
                                                                                            variant="flat"
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
                                                            <Tooltip
                                                                color="warning"
                                                                content={
                                                                    favoriteTopics[topic.topicId]
                                                                        ? "取消收藏"
                                                                        : "添加收藏"
                                                                }
                                                                placement="top"
                                                            >
                                                                <HeroUIButton
                                                                    isIconOnly
                                                                    color="warning"
                                                                    size="sm"
                                                                    variant="flat"
                                                                    onPress={() => toggleFavorite(topic.topicId)}
                                                                >
                                                                    <Star
                                                                        fill={
                                                                            favoriteTopics[topic.topicId]
                                                                                ? "currentColor"
                                                                                : "none"
                                                                        }
                                                                        size={16}
                                                                    />
                                                                </HeroUIButton>
                                                            </Tooltip>
                                                            {!readTopics[topic.topicId] && (
                                                                <Tooltip
                                                                    color="primary"
                                                                    content="标记为已读"
                                                                    placement="top"
                                                                >
                                                                    <HeroUIButton
                                                                        isIconOnly
                                                                        color="primary"
                                                                        size="sm"
                                                                        variant="flat"
                                                                        onPress={() => markAsRead(topic.topicId)}
                                                                    >
                                                                        <Check size={16} />
                                                                    </HeroUIButton>
                                                                </Tooltip>
                                                            )}
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
                                <p className="text-default-500">暂无话题数据，请调整筛选条件后重试</p>
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
