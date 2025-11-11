/**
 * 格式化时间显示
 * @param date 日期对象或时间字符串
 * @param format 格式类型
 * @returns 格式化后的时间字符串
 */
export function formatTime(date: Date | string, format: "short" | "long" = "short"): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return "无效时间";
    }

    if (format === "short") {
        return dateObj.toLocaleDateString("zh-CN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    return dateObj.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

/**
 * 格式化时间范围
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 格式化后的时间范围字符串
 */
export function formatTimeRange(startTime: Date | string, endTime: Date | string): string {
    return `${formatTime(startTime)} ➡️ ${formatTime(endTime)}`;
}

/**
 * 获取相对时间描述
 * @param date 日期对象或时间字符串
 * @returns 相对时间描述
 */
export function getRelativeTime(date: Date | string): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return formatTime(dateObj);
}
