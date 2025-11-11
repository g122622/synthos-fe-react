import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Sparkles, MessageSquare } from "lucide-react";

interface TopicHeaderProps {
    title: string;
    description: string;
    onRefresh: () => void;
    loading?: boolean;
}

export const TopicHeader: React.FC<TopicHeaderProps> = ({ title, description, onRefresh, loading = false }) => {
    return (
        <Card className="mb-6">
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-md font-bold">{title}</p>
                    <p className="text-small text-default-500">{description}</p>
                </div>
            </CardHeader>
            <CardBody>
                <div className="flex items-center gap-4">
                    <Chip color="primary" variant="flat" startContent={<Sparkles size={16} />}>
                        AI 驱动的话题摘要
                    </Chip>
                    <Chip color="secondary" variant="flat" startContent={<MessageSquare size={16} />}>
                        智能兴趣评分
                    </Chip>
                    <Button color="primary" variant="flat" size="sm" onPress={onRefresh} isDisabled={loading}>
                        {loading ? "刷新中..." : "刷新"}
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
};
