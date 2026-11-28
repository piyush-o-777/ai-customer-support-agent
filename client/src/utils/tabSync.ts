const CHANNEL_NAME = 'ai-support-tab-sync';
const STORAGE_EVENT_KEY = 'ai_support_sync_event';
const ACTIVE_CONVERSATION_KEY = 'active_conversation_id';

export type SyncEvent =
  | { type: 'AUTH_LOGIN' }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CONVERSATIONS_UPDATED' }
  | { type: 'MESSAGES_UPDATED'; conversationId: string }
  | { type: 'CONVERSATION_DELETED'; conversationId: string }
  | { type: 'ACTIVE_CONVERSATION_CHANGED'; conversationId: string | null };

interface WireSyncMessage {
  event: SyncEvent;
  ts: number;
}

export const getStoredConversationId = (): string | null =>
  localStorage.getItem(ACTIVE_CONVERSATION_KEY);

export const setStoredConversationId = (conversationId: string | null): void => {
  if (conversationId) {
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversationId);
  } else {
    localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
  }
};

export const broadcastSyncEvent = (event: SyncEvent): void => {
  const payload: WireSyncMessage = { event, ts: Date.now() };
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(payload);
    channel.close();
  }
  try {
    localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(payload));
    localStorage.removeItem(STORAGE_EVENT_KEY);
  } catch {
    return;
  }
};

export const subscribeSyncEvents = (handler: (event: SyncEvent) => void): (() => void) => {
  let channel: BroadcastChannel | null = null;
  let lastTs = 0;

  const dispatch = (payload: WireSyncMessage) => {
    if (!payload || !payload.event || payload.ts <= lastTs) {
      return;
    }
    lastTs = payload.ts;
    handler(payload.event);
  };

  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (msg: MessageEvent<WireSyncMessage>) => {
      dispatch(msg.data);
    };
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_EVENT_KEY || !e.newValue) {
      return;
    }
    try {
      const parsed = JSON.parse(e.newValue) as WireSyncMessage;
      dispatch(parsed);
    } catch {
      return;
    }
  };

  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener('storage', onStorage);
    if (channel) {
      channel.close();
    }
  };
};
