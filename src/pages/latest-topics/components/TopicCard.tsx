import { Card, CardHeader, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { ScrollShadow } from "@heroui/scroll-shadow";

import { TopicItem } from "../../../types/topic";
import { parseContributors } from "../../../utils/textUtils";
import { generateColorFromInterestScore } from "../../../utils/colorUtils";
import { formatTimeRange } from "../../../utils/timeUtils";

import { EnhancedDetail } from "./EnhancedDetail";
import { TopicActions } from "./TopicActions";

interface TopicCardProps {
    topic: TopicItem;
    isRead: boolean;
    isFavorite: boolean;
    onMarkAsRead: () => void;
    onToggleFavorite: () => void;
    interestScores?: Record<string, number>;
}

export function TopicCard({ topic, isRead, isFavorite, onMarkAsRead, onToggleFavorite, interestScores }: TopicCardProps) {
    const contributorsArray = parseContributors(topic.groupId || "[]");

    const handleCopy = async () => {
        try {
            const textToCopy = `${topic.groupName}\n${topic.detail}\n时间: ${formatTimeRange(topic.timeStart, topic.timeEnd)}`;

            await navigator.clipboard.writeText(textToCopy);
            // 这里可以添加 toast 提示
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    const handleMarkAsRead = () => {
        onMarkAsRead();
    };

    const handleToggleFavorite = () => {
        onToggleFavorite();
    };

    return (
        <Card key={topic.topicId} className="mb-4 transition-all hover:shadow-lg" isDisabled={isRead}>
            <CardHeader className="flex flex-col gap-2 pb-2">
                <div className="flex justify-between items-start w-full">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold">{topic.contributors}</h3>
                        {interestScores && interestScores[topic.topicId] !== undefined && (
                            <Chip
                                className="mt-1"
                                size="sm"
                                style={{
                                    backgroundColor: generateColorFromInterestScore(interestScores[topic.topicId]),
                                    color: "white"
                                }}
                                variant="flat"
                            >
                                兴趣指数: {interestScores[topic.topicId].toFixed(1)}
                            </Chip>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Tooltip color="success" content="复制话题内容" placement="top">
                            <Button isIconOnly size="sm" variant="flat" onPress={handleCopy}>
                                <Copy size={16} />
                            </Button>
                        </Tooltip>
                    </div>
                </div>
                <div className="text-default-500 text-sm">
                    <Chip className="mr-1" size="sm" variant="flat">
                        🕗 {formatTimeRange(topic.timeStart, topic.timeEnd)}
                    </Chip>
                </div>
            </CardHeader>

            <CardBody className="relative pb-9">
                <ScrollShadow className="max-h-40">
                    <EnhancedDetail contributors={contributorsArray} detail={topic.detail} />
                </ScrollShadow>

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

                {/* 右下角的操作按钮 */}
                <TopicActions
                    interestScores={interestScores}
                    isFavorite={isFavorite}
                    isRead={isRead}
                    topic={topic}
                    onCopy={handleCopy}
                    onMarkAsRead={handleMarkAsRead}
                    onToggleFavorite={handleToggleFavorite}
                />
            </CardBody>
        </Card>
    );
}
