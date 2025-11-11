import React from "react";

import { generateColorFromName } from "@/utils/colorUtils";

interface EnhancedDetailProps {
    contributors: string[];
    detail: string;
}

export const EnhancedDetail: React.FC<EnhancedDetailProps> = ({ contributors, detail }) => {
    const processDetail = (text: string) => {
        // 匹配 @用户名 格式
        const processedText = text.replace(/@([^\s@]+)/g, (match, username) => {
            const color = generateColorFromName(username);

            return `<span style="background-color: ${color}; color: white; padding: 2px 6px; border-radius: 12px; font-size: 0.875rem; font-weight: 500;">@${username}</span>`;
        });

        // 匹配链接
        const withLinks = processedText.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">$1</a>');

        return withLinks;
    };

    return (
        <div className="space-y-3">
            {/* 贡献者展示 */}
            {contributors.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {contributors.map((contributor, idx) => (
                        <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                                backgroundColor: generateColorFromName(contributor),
                                color: generateColorFromName(contributor, false)
                            }}
                        >
                            {contributor}
                        </span>
                    ))}
                </div>
            )}

            {/* 详情内容 */}
            <div dangerouslySetInnerHTML={{ __html: processDetail(detail) }} className="text-sm leading-relaxed break-words" />
        </div>
    );
};
