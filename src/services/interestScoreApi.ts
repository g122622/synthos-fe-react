// 兴趣得分相关API服务
const API_BASE_URL = "http://localhost:3002";

// 通用响应格式
interface BaseResponse {
    success: boolean;
}

interface SuccessResponse<T> extends BaseResponse {
    data: T;
}

interface ErrorResponse extends BaseResponse {
    message: string;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// 用户兴趣关键词接口
interface UserInterest {
    keyword: string;
    liked: boolean;
}

// 兴趣得分结果接口
interface InterestScoreResult {
    topicId: string;
    score: number;
}

/**
 * 获取话题的兴趣得分
 * @param topicId 话题ID
 * @returns 兴趣得分结果
 */
export const getInterestScoreResult = async (topicId: string): Promise<ApiResponse<InterestScoreResult>> => {
    const params = new URLSearchParams({ topicId });
    const response = await fetch(`${API_BASE_URL}/api/interest-score-result?${params}`);

    return response.json();
};

/**
 * 检查话题的兴趣得分结果是否存在
 * @param topicId 话题ID
 * @returns 是否存在兴趣得分结果
 */
export const isInterestScoreResultExist = async (topicId: string): Promise<ApiResponse<{ isExist: boolean }>> => {
    const params = new URLSearchParams({ topicId });
    const response = await fetch(`${API_BASE_URL}/api/is-interest-score-result-exist?${params}`);

    return response.json();
};
