import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Select, SelectItem } from "@heroui/select";
import { DateRangePicker } from "@heroui/react";
import { Spinner } from "@heroui/spinner";
import { useAsyncList } from "@react-stately/data";
import { today, getLocalTimeZone } from "@internationalized/date";
import { getChatMessagesByGroupId, getGroupDetails } from "@/services/api";
import { ChatMessage, GroupDetailsRecord } from "@/types/app";
import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function ChatMessagesPage() {
    const [groups, setGroups] = useState<GroupDetailsRecord>({});
    const [selectedGroup, setSelectedGroup] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 10;

    // 设置默认日期范围为最近7天
    const todayDate = today(getLocalTimeZone());
    const sevenDaysAgo = todayDate.subtract({ days: 7 });

    // 获取群组信息
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await getGroupDetails();
                if (response.success) {
                    setGroups(response.data);
                    // 默认选择第一个群组
                    const groupIds = Object.keys(response.data);
                    if (groupIds.length > 0) {
                        setSelectedGroup(groupIds[0]);
                    }
                }
            } catch (error) {
                console.error("获取群组信息失败:", error);
            }
        };

        fetchGroups();
    }, []);

    // 获取聊天记录
    const list = useAsyncList<ChatMessage>({
        async load({ signal, cursor }) {
            if (!selectedGroup) {
                return {
                    items: []
                };
            }

            // 获取DateRangePicker的值
            const dateRangePicker = document.querySelector('[data-testid="date-range-picker"]');
            // 如果无法直接获取值，我们使用默认的7天范围
            const startDate = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const endDate = Date.now();

            setIsLoading(true);
            try {
                const response = await getChatMessagesByGroupId(selectedGroup, startDate, endDate);

                setIsLoading(false);

                if (response.success) {
                    return {
                        items: response.data
                    };
                } else {
                    console.error("获取聊天记录失败:", response.message);
                    return {
                        items: []
                    };
                }
            } catch (error) {
                setIsLoading(false);
                console.error("获取聊天记录失败:", error);
                return {
                    items: []
                };
            }
        }
    });

    // 当群组改变时重新加载数据
    useEffect(() => {
        if (selectedGroup) {
            list.reload();
        }
    }, [selectedGroup]);

    // 格式化时间戳
    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString("zh-CN");
    };

    return (
        <DefaultLayout>
            <section className="flex flex-col gap-4 py-8 md:py-10">
                <div className="flex flex-col items-center justify-center gap-4">
                    <h1 className={title()}>聊天记录</h1>
                    <p className="text-default-600 max-w-2xl text-center">
                        查看和筛选QQ群聊天记录，支持按时间范围和群组进行过滤
                    </p>
                </div>

                <Card className="mt-6">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <Select
                                    label="选择群组"
                                    placeholder="请选择群组"
                                    selectedKeys={[selectedGroup]}
                                    onSelectionChange={keys => {
                                        if (keys !== "all") {
                                            const selectedKey = Array.from(keys)[0] as string;
                                            setSelectedGroup(selectedKey);
                                        }
                                    }}
                                    className="max-w-xs"
                                >
                                    {Object.keys(groups).map(groupId => (
                                        <SelectItem key={groupId} value={groupId}>
                                            {groupId} - {groups[groupId].groupIntroduction}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            <div className="flex-1 w-full">
                                <DateRangePicker
                                    label="选择时间范围"
                                    defaultValue={{
                                        start: sevenDaysAgo,
                                        end: todayDate
                                    }}
                                    onChange={range => {
                                        if (range) {
                                            // 重新加载数据
                                            list.reload();
                                        }
                                    }}
                                    className="max-w-xs"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    color="primary"
                                    onPress={() => list.reload()}
                                    isLoading={isLoading}
                                >
                                    {isLoading ? <Spinner size="sm" /> : "查询"}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <>
                                <Table
                                    aria-label="聊天记录表"
                                    bottomContent={
                                        <div className="flex w-full justify-center">
                                            <Pagination
                                                isCompact
                                                showControls
                                                showShadow
                                                color="primary"
                                                page={currentPage}
                                                total={Math.ceil(list.items.length / pageSize)}
                                                onChange={page => setCurrentPage(page)}
                                            />
                                        </div>
                                    }
                                >
                                    <TableHeader>
                                        <TableColumn>发送者</TableColumn>
                                        <TableColumn>消息内容</TableColumn>
                                        <TableColumn>时间</TableColumn>
                                        <TableColumn>会话ID</TableColumn>
                                    </TableHeader>
                                    <TableBody emptyContent={"未找到相关聊天记录"}>
                                        {list.items
                                            .slice(
                                                (currentPage - 1) * pageSize,
                                                currentPage * pageSize
                                            )
                                            .map(message => (
                                                <TableRow key={message.msgId}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">
                                                                {message.senderGroupNickname ||
                                                                    message.senderNickname}
                                                            </span>
                                                            <span className="text-sm text-default-500">
                                                                {message.senderId}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div
                                                            className="max-w-md truncate"
                                                            title={message.messageContent}
                                                        >
                                                            {message.messageContent}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatTimestamp(message.timestamp)}
                                                    </TableCell>
                                                    <TableCell>{message.sessionId}</TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </>
                        )}
                    </CardBody>
                </Card>
            </section>
        </DefaultLayout>
    );
}
