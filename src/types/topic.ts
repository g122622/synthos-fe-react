export interface TopicItem {
    topicId: string;
    groupId: string;
    groupName: string;
    detail: string;
    timeStart: string;
    timeEnd: string;
    sessionId: string;
    interestScore?: number;
    contributors: string;
}

export interface TopicFilters {
    searchQuery: string;
    showOnlyUnread: boolean;
    showOnlyFavorites: boolean;
    dateRange: {
        start: Date;
        end: Date;
    };
    interestScoreRange: number[];
}

export interface TopicStatus {
    readTopics: Record<string, boolean>;
    favoriteTopics: Record<string, boolean>;
}
