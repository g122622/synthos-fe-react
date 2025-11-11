import { useState, useCallback, useEffect } from "react";

import { TopicReadStatusManager } from "../util/TopicReadStatusManager";
import { TopicFavoriteStatusManager } from "../util/TopicFavoriteStatusManager";
import { TOAST_MESSAGES } from "../constants/defaults";

export function useTopicStatus() {
    const [readTopics, setReadTopics] = useState<Record<string, boolean>>({});
    const [favoriteTopics, setFavoriteTopics] = useState<Record<string, boolean>>({});

    // 初始化已读状态
    useEffect(() => {
        const loadReadStatus = async () => {
            try {
                const readStatusManager = TopicReadStatusManager.getInstance();
                const statuses = await readStatusManager.getAllReadStatus();

                setReadTopics(statuses);
            } catch (error) {
                console.error("Failed to load read status:", error);
            }
        };

        loadReadStatus();
    }, []);

    // 初始化收藏状态
    useEffect(() => {
        const loadFavoriteStatus = async () => {
            try {
                const favoriteStatusManager = TopicFavoriteStatusManager.getInstance();
                const statuses = await favoriteStatusManager.getAllFavoriteStatus();

                setFavoriteTopics(statuses);
            } catch (error) {
                console.error("Failed to load favorite status:", error);
            }
        };

        loadFavoriteStatus();
    }, []);

    /**
     * 标记话题为已读
     */
    const markAsRead = useCallback(async (topicId: string) => {
        try {
            const readStatusManager = TopicReadStatusManager.getInstance();

            await readStatusManager.markAsRead(topicId);

            setReadTopics(prev => ({
                ...prev,
                [topicId]: true
            }));

            return { success: true, message: TOAST_MESSAGES.MARK_READ_SUCCESS };
        } catch (error) {
            console.error("Failed to mark topic as read:", error);

            return { success: false, message: TOAST_MESSAGES.MARK_READ_ERROR };
        }
    }, []);

    /**
     * 切换话题收藏状态
     */
    const toggleFavorite = useCallback(
        async (topicId: string) => {
            try {
                const favoriteStatusManager = TopicFavoriteStatusManager.getInstance();
                const isCurrentlyFavorite = favoriteTopics[topicId];

                if (isCurrentlyFavorite) {
                    await favoriteStatusManager.removeFromFavorites(topicId);
                } else {
                    await favoriteStatusManager.markAsFavorite(topicId);
                }

                setFavoriteTopics(prev => ({
                    ...prev,
                    [topicId]: !isCurrentlyFavorite
                }));

                return { success: true, message: TOAST_MESSAGES.TOGGLE_FAVORITE_SUCCESS };
            } catch (error) {
                console.error("Failed to toggle favorite:", error);

                return { success: false, message: TOAST_MESSAGES.TOGGLE_FAVORITE_ERROR };
            }
        },
        [favoriteTopics]
    );

    /**
     * 批量标记为已读
     */
    const batchMarkAsRead = useCallback(async (topicIds: string[]) => {
        try {
            const readStatusManager = TopicReadStatusManager.getInstance();

            for (const topicId of topicIds) {
                await readStatusManager.markAsRead(topicId);
            }

            setReadTopics(prev => {
                const newReadTopics = { ...prev };

                topicIds.forEach(topicId => {
                    newReadTopics[topicId] = true;
                });

                return newReadTopics;
            });

            return {
                success: true,
                message: `${TOAST_MESSAGES.BATCH_MARK_READ_SUCCESS} (${topicIds.length}个话题)`
            };
        } catch (error) {
            console.error("Failed to batch mark topics as read:", error);

            return { success: false, message: TOAST_MESSAGES.BATCH_MARK_READ_ERROR };
        }
    }, []);

    return {
        readTopics,
        favoriteTopics,
        markAsRead,
        toggleFavorite,
        batchMarkAsRead
    };
}
