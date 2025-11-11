export const DEFAULT_PAGE_SIZE = 10;

export const DEFAULT_INTEREST_SCORE_RANGE = [0, 10];

export const DEFAULT_DATE_RANGE_DAYS = 7;

export const TOAST_MESSAGES = {
    MARK_READ_SUCCESS: "标记为已读",
    MARK_READ_ERROR: "标记已读失败",
    TOGGLE_FAVORITE_SUCCESS: "收藏状态已更新",
    TOGGLE_FAVORITE_ERROR: "更新收藏状态失败",
    BATCH_MARK_READ_SUCCESS: "批量标记成功",
    BATCH_MARK_READ_ERROR: "批量标记失败",
    COPY_SUCCESS: "已复制到剪贴板",
    COPY_ERROR: "复制失败",
    LOAD_ERROR: "加载数据失败"
} as const;

export const LOADING_MESSAGES = {
    FETCHING_TOPICS: "正在获取话题...",
    FETCHING_INTEREST_SCORE: "正在获取兴趣分数...",
    UPDATING_STATUS: "正在更新状态..."
} as const;
