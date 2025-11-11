/**
 * 根据名称生成颜色
 * @param name 名称
 * @param background 是否生成背景色
 * @returns 颜色值
 */
export function generateColorFromName(name: string, background: boolean = true): string {
    if (!name) return background ? "#e5e7eb" : "#6b7280";

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    const saturation = background ? 70 : 85;
    const lightness = background ? 75 : 35;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * 根据兴趣分数生成颜色
 * @param score 兴趣分数
 * @returns 颜色值
 */
export function generateColorFromInterestScore(score: number): string {
    if (score === undefined || score === null) return "#e5e7eb";

    // 将分数映射到色相值 (0-120: 红色到绿色)
    const hue = Math.min(Math.max(score * 12, 0), 120);
    return `hsl(${hue}, 70%, 60%)`;
}
