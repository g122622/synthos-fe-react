// API服务封装
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

// 健康检查接口
export const healthCheck = async (): Promise<ApiResponse<{ message: string; timestamp: string }>> => {
    const response = await fetch(`${API_BASE_URL}/health`);

    return response.json();
};

// 群组相关接口
interface GroupDetail {
    IM: string;
    splitStrategy: string;
    groupIntroduction: string;
    aiModel: string;
}

interface GroupDetailsResponse {
    [groupId: string]: GroupDetail;
}

export const getGroupDetails = async (): Promise<ApiResponse<GroupDetailsResponse>> => {
    const response = await fetch(`${API_BASE_URL}/api/group-details`);

    return response.json();
};

// 聊天消息相关接口
interface ChatMessage {
    msgId: string;
    messageContent: string;
    groupId: string;
    timestamp: number;
    senderId: string;
    senderGroupNickname: string;
    senderNickname: string;
    quotedMsgId: string;
    sessionId: string;
    preProcessedContent: string;
}

interface ChatMessagesResponse extends Array<ChatMessage> {}

export const getChatMessagesByGroupId = async (
    groupId: string,
    timeStart: number,
    timeEnd: number
): Promise<ApiResponse<ChatMessagesResponse>> => {
    const params = new URLSearchParams({
        groupId,
        timeStart: timeStart.toString(),
        timeEnd: timeEnd.toString()
    });

    const response = await fetch(`${API_BASE_URL}/api/chat-messages-by-group-id?${params}`);

    return response.json();
};

export const getSessionIdsByGroupIdAndTimeRange = async (
    groupId: string,
    timeStart: number,
    timeEnd: number
): Promise<ApiResponse<string[]>> => {
    const params = new URLSearchParams({
        groupId,
        timeStart: timeStart.toString(),
        timeEnd: timeEnd.toString()
    });

    const response = await fetch(`${API_BASE_URL}/api/session-ids-by-group-id-and-time-range?${params}`);

    return response.json();
};

export const getSessionTimeDuration = async (
    sessionId: string
): Promise<ApiResponse<{ timeStart: number; timeEnd: number }>> => {
    const params = new URLSearchParams({
        sessionId
    });
    const response = await fetch(`${API_BASE_URL}/api/session-time-duration?${params}`);

    return response.json();
};

// AI摘要相关接口
interface AIDigestResult {
    topicId: string;
    sessionId: string;
    topic: string;
    contributors: string;
    detail: string;
}

interface AIDigestResultResponse extends AIDigestResult {}

interface AIDigestResultsResponse extends Array<AIDigestResult> {}

export const getAIDigestResultByTopicId = async (topicId: string): Promise<ApiResponse<AIDigestResultResponse>> => {
    const params = new URLSearchParams({ topicId });
    const response = await fetch(`${API_BASE_URL}/api/ai-digest-result-by-topic-id?${params}`);

    return response.json();
};

export const getAIDigestResultsBySessionId = async (
    sessionId: string
): Promise<ApiResponse<AIDigestResultsResponse>> => {
    const params = new URLSearchParams({ sessionId });
    const response = await fetch(`${API_BASE_URL}/api/ai-digest-results-by-session-id?${params}`);

    return response.json();
};

export const isSessionSummarized = async (sessionId: string): Promise<ApiResponse<{ isSummarized: boolean }>> => {
    const params = new URLSearchParams({ sessionId });
    const response = await fetch(`${API_BASE_URL}/api/is-session-summarized?${params}`);

    return response.json();
};

// 其他接口
interface QQAvatarResponse {
    avatarBase64: string;
}

export const getQQAvatar = async (qqNumber: string): Promise<ApiResponse<QQAvatarResponse>> => {
    const params = new URLSearchParams({ qqNumber });
    const response = await fetch(`${API_BASE_URL}/api/qq-avatar?${params}`);

    return response.json();
};
