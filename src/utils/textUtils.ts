import React from "react";
import { ExternalLink } from "lucide-react";

/**
 * 解析贡献者列表
 * @param contributors 贡献者字符串
 * @returns 贡献者数组
 */
export function parseContributors(contributors: string): string[] {
    if (!contributors) return [];
    
    return contributors
        .split(/[,，、\s]+/)
        .map(name => name.trim())
        .filter(name => name.length > 0);
}

/**
 * 锚点图标组件
 */
export const AnchorIcon: React.FC<{ href?: string; className?: string }> = ({ 
    href, 
    className = "" 
}) => {
    if (!href) return null;
    
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 ${className}`}
        >
            <ExternalLink size={12} />
        </a>
    );
};