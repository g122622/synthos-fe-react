import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";

import { getGroupDetails, getChatMessagesByGroupId } from "@/services/api";
import { GroupDetailsRecord } from "@/types/app";
import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function GroupsPage() {
    const [groups, setGroups] = useState<GroupDetailsRecord>({});
    const [recentMessageCounts, setRecentMessageCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // 获取最近24小时的时间戳
    const getRecent24HoursTimestamps = () => {
        const now = new Date().getTime();
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

        return { startTime: twentyFourHoursAgo, endTime: now };
    };

    // 获取群组信息
    useEffect(() => {
        const fetchGroups = async () => {
            setIsLoading(true);
            try {
                const response = await getGroupDetails();

                if (response.success) {
                    setGroups(response.data);
                    // 获取每个群组的最近24小时消息量
                    await fetchRecentMessageCounts(response.data);
                } else {
                    console.error("获取群组信息失败:", response.message);
                }
            } catch (error) {
                console.error("获取群组信息失败:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchRecentMessageCounts = async (groupsData: GroupDetailsRecord) => {
            const { startTime, endTime } = getRecent24HoursTimestamps();
            const counts: Record<string, number> = {};

            // 并行获取所有群组的最近24小时消息量
            const promises = Object.keys(groupsData).map(async groupId => {
                try {
                    const response = await getChatMessagesByGroupId(groupId, startTime, endTime);

                    if (response.success) {
                        counts[groupId] = response.data.length;
                    } else {
                        counts[groupId] = 0;
                    }
                } catch (error) {
                    console.error(`获取群组 ${groupId} 的最近24小时消息量失败:`, error);
                    counts[groupId] = 0;
                }
            });

            await Promise.all(promises);
            setRecentMessageCounts(counts);
        };

        fetchGroups();
    }, []);

    // 获取分组策略标签
    const getSplitStrategyLabel = (strategy: string) => {
        switch (strategy) {
            case "realtime":
                return "实时分组";
            case "accumulative":
                return "累积分组";
            default:
                return strategy;
        }
    };

    // 获取分组策略颜色
    const getSplitStrategyColor = (strategy: string) => {
        switch (strategy) {
            case "realtime":
                return "success";
            case "accumulative":
                return "warning";
            default:
                return "default";
        }
    };

    // 获取AI模型标签
    const getAIModelLabel = (model: string) => {
        switch (model) {
            case "gpt-3.5-turbo":
                return "GPT-3.5 Turbo";
            case "gpt-4":
                return "GPT-4";
            default:
                return model;
        }
    };

    return (
        <DefaultLayout>
            <section className="flex flex-col gap-4 py-8 md:py-10">
                <div className="flex flex-col items-center justify-center gap-4">
                    <h1 className={title()}>群组管理</h1>
                    <p className="text-default-600 max-w-2xl text-center">
                        管理QQ群组配置信息，查看群组AI模型设置和分组策略
                    </p>
                </div>

                <Card className="mt-6">
                    <CardHeader>
                        <div className="flex justify-between items-center w-full p-3">
                            <h3 className="text-lg font-bold">群组列表</h3>
                            <Button
                                color="primary"
                                isLoading={isLoading}
                                size="sm"
                                onPress={() => window.location.reload()}
                            >
                                {isLoading ? <Spinner size="sm" /> : "刷新"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <Table aria-label="群组列表">
                                <TableHeader>
                                    <TableColumn>群号</TableColumn>
                                    <TableColumn>平台</TableColumn>
                                    <TableColumn>群介绍</TableColumn>
                                    <TableColumn>分组策略</TableColumn>
                                    <TableColumn>AI模型</TableColumn>
                                    <TableColumn>最近24小时消息量</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent={"未找到群组信息"}>
                                    {Object.entries(groups).map(([groupId, groupDetail]) => (
                                        <TableRow key={groupId}>
                                            <TableCell className="font-semibold">{groupId}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    color={groupDetail.IM === "QQ" ? "primary" : "secondary"}
                                                    variant="flat"
                                                >
                                                    {groupDetail.IM}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>{groupDetail.groupIntroduction}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    color={getSplitStrategyColor(groupDetail.splitStrategy)}
                                                    variant="flat"
                                                >
                                                    {getSplitStrategyLabel(groupDetail.splitStrategy)}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>{getAIModelLabel(groupDetail.aiModel)}</TableCell>
                                            <TableCell>
                                                {recentMessageCounts[groupId] !== undefined ? (
                                                    <span className="font-semibold">
                                                        {recentMessageCounts[groupId]}
                                                    </span>
                                                ) : (
                                                    <Spinner size="sm" />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>

                {/* <Card className="mt-6">
                    <CardHeader>
                        <h3 className="text-lg font-bold">使用说明</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold mb-2">分组策略</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>
                                        <span className="font-medium">实时分组:</span>{" "}
                                        根据消息时间实时划分会话
                                    </li>
                                    <li>
                                        <span className="font-medium">累积分组:</span>{" "}
                                        将连续消息累积为一个会话
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">AI模型</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>
                                        <span className="font-medium">GPT-3.5 Turbo:</span>{" "}
                                        快速且成本较低的模型
                                    </li>
                                    <li>
                                        <span className="font-medium">GPT-4:</span>{" "}
                                        更强大但成本较高的模型
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </CardBody>
                </Card> */}
            </section>
        </DefaultLayout>
    );
}
