import React from "react";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Chip } from "@heroui/chip";
import { MoreVertical, Star, Check, Copy } from "lucide-react";
import { TopicItem } from "../../../types/topic";
import { parseContributors } from "../../../utils/textUtils";
import { generateColorFromName } from "../../../utils/colorUtils";
import { formatTime } from "../../../utils/timeUtils";

interface TopicActionsProps {
    topic: TopicItem;
    isRead: boolean;
    isFavorite: boolean;
    onMarkAsRead: () => void;
    onToggleFavorite: () => void;
    onCopy: () => void;
    interestScores?: Record<string, number>;
}

export const TopicActions: React.FC<TopicActionsProps> = ({ topic, isRead, isFavorite, onMarkAsRead, onToggleFavorite, onCopy, interestScores }) => {
    const contributorsArray = parseContributors(topic.contributors || "[]");

    return (
        <div className="absolute bottom-3 right-3 flex gap-1">
            {/* 更多选项下拉菜单 */}
            <Dropdown>
                <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                        <MoreVertical size={16} />
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="更多选项">
                    <DropdownItem key="participants" textValue="参与者">
                        <div className="flex flex-col gap-1">
                            <p className="font-medium">参与者</p>
                            <div className="flex flex-wrap gap-1">
                                {contributorsArray.map((contributor, idx) => (
                                    <Chip
                                        key={idx}
                                        size="sm"
                                        style={{
                                            backgroundColor: generateColorFromName(contributor),
                                            color: generateColorFromName(contributor, false),
                                            fontWeight: "bold"
                                        }}
                                        variant="flat"
                                    >
                                        {contributor}
                                    </Chip>
                                ))}
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

            {/* 收藏按钮 */}
            <Tooltip color="warning" content={isFavorite ? "取消收藏" : "添加收藏"} placement="top">
                <Button isIconOnly color="warning" size="sm" variant="flat" onPress={onToggleFavorite}>
                    <Star fill={isFavorite ? "currentColor" : "none"} size={16} />
                </Button>
            </Tooltip>

            {/* 已读按钮 */}
            {!isRead && (
                <Tooltip color="primary" content="标记为已读" placement="top">
                    <Button isIconOnly color="primary" size="sm" variant="flat" onPress={onMarkAsRead}>
                        <Check size={16} />
                    </Button>
                </Tooltip>
            )}

            {/* 复制按钮 */}
            <Tooltip color="success" content="复制话题内容" placement="top">
                <Button isIconOnly color="success" size="sm" variant="flat" onPress={onCopy}>
                    <Copy size={16} />
                </Button>
            </Tooltip>
        </div>
    );
};
