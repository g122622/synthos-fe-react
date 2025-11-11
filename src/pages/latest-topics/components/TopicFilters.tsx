import React from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Slider } from "@heroui/slider";
import { DateRangePicker } from "@heroui/react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Search, RotateCcw } from "lucide-react";
import { TopicFilters } from "../../../types/topic";
import { DEFAULT_INTEREST_SCORE_RANGE } from "../../../constants/defaults";

interface TopicFiltersProps {
    filters: TopicFilters;
    onFiltersChange: (filters: Partial<TopicFilters>) => void;
    onReset: () => void;
}

export const TopicFilters: React.FC<TopicFiltersProps> = ({ filters, onFiltersChange, onReset }) => {
    return (
        <Card className="mb-6">
            <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 搜索框 */}
                    <Input
                        placeholder="搜索话题内容..."
                        startContent={<Search size={16} />}
                        value={filters.searchQuery}
                        onChange={e => onFiltersChange({ searchQuery: e.target.value })}
                        variant="bordered"
                    />

                    {/* 日期范围选择 */}
                    <DateRangePicker
                        label="时间范围"
                        value={{
                            start: filters.dateRange.start,
                            end: filters.dateRange.end
                        }}
                        onChange={range => {
                            if (range) {
                                onFiltersChange({
                                    dateRange: {
                                        start: range.start as Date,
                                        end: range.end as Date
                                    }
                                });
                            }
                        }}
                        variant="bordered"
                    />

                    {/* 兴趣分数范围 */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm">兴趣分数</span>
                            <Chip size="sm" variant="flat">
                                {filters.interestScoreRange[0]} - {filters.interestScoreRange[1]}
                            </Chip>
                        </div>
                        <Slider
                            size="sm"
                            step={1}
                            minValue={0}
                            maxValue={10}
                            value={filters.interestScoreRange}
                            onChange={value => {
                                const range = Array.isArray(value) ? value : [value, value];
                                onFiltersChange({ interestScoreRange: range });
                            }}
                            className="max-w-md"
                        />
                    </div>

                    {/* 筛选选项和重置按钮 */}
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Checkbox isSelected={filters.showOnlyUnread} onValueChange={checked => onFiltersChange({ showOnlyUnread: checked })} size="sm">
                                仅未读
                            </Checkbox>
                            <Checkbox isSelected={filters.showOnlyFavorites} onValueChange={checked => onFiltersChange({ showOnlyFavorites: checked })} size="sm">
                                仅收藏
                            </Checkbox>
                        </div>
                        <Button size="sm" variant="flat" startContent={<RotateCcw size={14} />} onPress={onReset}>
                            重置筛选
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};
