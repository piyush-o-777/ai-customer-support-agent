import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box } from '@mui/material';
import {
  createConversationRequest,
  deleteConversationRequest,
  getMessagesRequest,
  listConversationsRequest,
  streamMessageRequest,
} from '../api/chatApi';
import { getApiErrorMessage } from '../api/client';
import { ChatInput } from '../components/chat/ChatInput';
import { ConversationSidebar } from '../components/chat/ConversationSidebar';
import { MessageList } from '../components/chat/MessageList';
import { ChatMessagesSkeleton } from '../components/common/ChatMessagesSkeleton';
import { TopBar } from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useReadAloud } from '../hooks/useReadAloud';
import { ChatMessage, ChatWidthMode, Conversation } from '../types/chat.types';
import {
  broadcastSyncEvent,
  getStoredConversationId,
  setStoredConversationId,
  subscribeSyncEvents,
} from '../utils/tabSync';

const WORD_REVEAL_INTERVAL_MS = 28;
const CHAT_WIDTH_STORAGE_KEY = 'chat_width_mode';

const WIDTH_MAP: Record<ChatWidthMode, number | string> = {
  full: '100%',
  medium: 820,
  mobile: 440,
};

const getInitialWidthMode = (): ChatWidthMode => {
  const saved = localStorage.getItem(CHAT_WIDTH_STORAGE_KEY);
  return saved === 'full' || saved === 'medium' || saved === 'mobile' ? saved : 'full';
};

export const ChatPage = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { speakingId, toggleSpeak, stop: stopSpeaking } = useReadAloud((msg) =>
    showToast(msg, 'warning')
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(() =>
    getStoredConversationId()
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingConversationId, setStreamingConversationId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState<ChatWidthMode>(getInitialWidthMode);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [quotedText, setQuotedText] = useState('');
  const [error, setError] = useState('');
  const activeConversationRef = useRef<string | null>(conversationId);
  const skipNextFetchRef = useRef(false);
  const wordQueueRef = useRef<string[]>([]);
  const streamFinishedRef = useRef(false);
  const revealTimerRef = useRef<number | null>(null);

  useEffect(() => {
    activeConversationRef.current = conversationId;
  }, [conversationId]);

  const stopRevealTimer = useCallback(() => {
    if (revealTimerRef.current !== null) {
      window.clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    wordQueueRef.current = [];
    streamFinishedRef.current = false;
  }, []);

  useEffect(() => {
    return () => stopRevealTimer();
  }, [stopRevealTimer]);

  const fetchConversations = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoadingConversations(true);
    }
    try {
      const { conversations: list } = await listConversationsRequest();
      setConversations(list);
      const currentId = activeConversationRef.current;
      if (currentId && !list.some((item) => item.id === currentId)) {
        setConversationId(null);
        setStoredConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load conversations'));
    } finally {
      if (showLoader) {
        setLoadingConversations(false);
      }
    }
  }, []);

  const fetchMessages = useCallback(async (id: string, showLoader = true) => {
    if (showLoader) {
      setLoadingMessages(true);
    }
    try {
      const { messages: list } = await getMessagesRequest(id);
      if (activeConversationRef.current === id) {
        setMessages(list);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load messages'));
    } finally {
      if (showLoader) {
        setLoadingMessages(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchConversations(true);
  }, [fetchConversations]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    void fetchMessages(conversationId, true);
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    const unsubscribe = subscribeSyncEvents((event) => {
      if (event.type === 'CONVERSATIONS_UPDATED') {
        void fetchConversations(false);
      } else if (event.type === 'MESSAGES_UPDATED') {
        void fetchConversations(false);
        if (activeConversationRef.current === event.conversationId) {
          void fetchMessages(event.conversationId, false);
        }
      } else if (event.type === 'CONVERSATION_DELETED') {
        setConversations((prev) => prev.filter((item) => item.id !== event.conversationId));
        if (activeConversationRef.current === event.conversationId) {
          setConversationId(null);
          setStoredConversationId(null);
          setMessages([]);
        }
      } else if (event.type === 'ACTIVE_CONVERSATION_CHANGED') {
        setConversationId(event.conversationId);
        setStoredConversationId(event.conversationId);
      }
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchConversations(false);
        if (activeConversationRef.current) {
          void fetchMessages(activeConversationRef.current, false);
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchConversations, fetchMessages]);

  const handleSelectConversation = (id: string) => {
    stopSpeaking();
    setError('');
    setQuotedText('');
    setConversationId(id);
    setStoredConversationId(id);
    broadcastSyncEvent({ type: 'ACTIVE_CONVERSATION_CHANGED', conversationId: id });
  };

  const handleNewChat = () => {
    stopSpeaking();
    setError('');
    setQuotedText('');
    setConversationId(null);
    setStoredConversationId(null);
    setMessages([]);
    broadcastSyncEvent({ type: 'ACTIVE_CONVERSATION_CHANGED', conversationId: null });
    showToast('Started a new conversation', 'info');
  };

  const handleLogout = async () => {
    stopSpeaking();
    await logout();
    showToast('Logged out successfully', 'info');
  };

  const handleDeleteConversation = async (id: string) => {
    stopSpeaking();
    setError('');
    setDeletingId(id);
    try {
      await deleteConversationRequest(id);
      setConversations((prev) => prev.filter((item) => item.id !== id));
      if (conversationId === id) {
        setConversationId(null);
        setStoredConversationId(null);
        setMessages([]);
      }
      broadcastSyncEvent({ type: 'CONVERSATION_DELETED', conversationId: id });
      showToast('Conversation deleted', 'success');
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to delete conversation');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    stopSpeaking();
    setError('');
    setBulkDeleting(true);
    try {
      await Promise.all(ids.map((id) => deleteConversationRequest(id)));
      setConversations((prev) => prev.filter((item) => !ids.includes(item.id)));
      if (conversationId && ids.includes(conversationId)) {
        setConversationId(null);
        setStoredConversationId(null);
        setMessages([]);
      }
      for (const id of ids) {
        broadcastSyncEvent({ type: 'CONVERSATION_DELETED', conversationId: id });
      }
      showToast(
        `Deleted ${ids.length} ${ids.length === 1 ? 'conversation' : 'conversations'}`,
        'success'
      );
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to delete selected conversations');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleSend = async (content: string) => {
    stopSpeaking();
    stopRevealTimer();
    setError('');
    setSending(true);
    setStreamingContent('');
    const targetInitialId = conversationId;
    setStreamingConversationId(targetInitialId);
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId: targetInitialId || 'pending',
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setScrollTrigger((prev) => prev + 1);
    let persistedUserMessageId: string | null = null;
    let resolveDrain: (() => void) | null = null;
    const drainPromise = new Promise<void>((resolve) => {
      resolveDrain = resolve;
    });

    const startWordReveal = () => {
      if (revealTimerRef.current !== null) {
        return;
      }
      revealTimerRef.current = window.setInterval(() => {
        if (wordQueueRef.current.length > 0) {
          const nextToken = wordQueueRef.current.shift() || '';
          setStreamingContent((prev) => prev + nextToken);
        } else if (streamFinishedRef.current) {
          stopRevealTimer();
          resolveDrain?.();
        }
      }, WORD_REVEAL_INTERVAL_MS);
    };

    try {
      let activeId = targetInitialId;
      if (!activeId) {
        const created = await createConversationRequest();
        activeId = created.conversation.id;
        setStreamingConversationId(activeId);
        if (activeConversationRef.current === null) {
          activeConversationRef.current = activeId;
          skipNextFetchRef.current = true;
          setConversationId(activeId);
          setStoredConversationId(activeId);
          broadcastSyncEvent({ type: 'ACTIVE_CONVERSATION_CHANGED', conversationId: activeId });
        }
        setConversations((prev) => [created.conversation, ...prev]);
        broadcastSyncEvent({ type: 'CONVERSATIONS_UPDATED' });
      }
      const streamConvId = activeId;
      const { userMessage, assistantMessage } = await streamMessageRequest(streamConvId, content, {
        onUserMessage: (savedUserMessage) => {
          persistedUserMessageId = savedUserMessage.id;
          if (activeConversationRef.current === streamConvId) {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === tempId ? savedUserMessage : msg))
            );
          }
          void fetchConversations(false);
        },
        onChunk: (chunk) => {
          const tokens = chunk.match(/\S+\s*|\s+/g);
          if (tokens && tokens.length > 0) {
            wordQueueRef.current.push(...tokens);
            startWordReveal();
          }
        },
      });
      streamFinishedRef.current = true;
      if (revealTimerRef.current !== null) {
        await drainPromise;
      }
      setStreamingContent('');
      setStreamingConversationId(null);
      if (activeConversationRef.current === streamConvId) {
        setMessages((prev) => {
          const filtered = prev.filter(
            (msg) => msg.id !== tempId && msg.id !== persistedUserMessageId
          );
          return [...filtered, userMessage, assistantMessage];
        });
      }
      void fetchConversations(false);
      broadcastSyncEvent({ type: 'MESSAGES_UPDATED', conversationId: streamConvId });
    } catch (err) {
      stopRevealTimer();
      setStreamingContent('');
      setStreamingConversationId(null);
      if (!persistedUserMessageId && activeConversationRef.current === targetInitialId) {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      }
      const message =
        err instanceof Error ? err.message : getApiErrorMessage(err, 'Failed to send message');
      setError(message);
      showToast(message, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleChangeChatWidth = (mode: ChatWidthMode) => {
    setChatWidth(mode);
    localStorage.setItem(CHAT_WIDTH_STORAGE_KEY, mode);
  };

  const chatMaxWidth = WIDTH_MAP[chatWidth];
  const isStreamingActiveChat = sending && streamingConversationId === conversationId;

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <TopBar
        user={user}
        chatWidth={chatWidth}
        onChangeChatWidth={handleChangeChatWidth}
        onNewChat={handleNewChat}
        onLogout={() => void handleLogout()}
        onToggleSidebar={() => setMobileOpen((prev) => !prev)}
        disableNewChat={sending}
      />
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Box component="nav" aria-label="Chat history sidebar" sx={{ display: 'flex' }}>
          <ConversationSidebar
            conversations={conversations}
            activeId={conversationId}
            loading={loadingConversations}
            deletingId={deletingId}
            bulkDeleting={bulkDeleting}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
            onSelect={handleSelectConversation}
            onNewChat={handleNewChat}
            onDelete={(id) => void handleDeleteConversation(id)}
            onBulkDelete={handleBulkDelete}
            disableActions={sending}
          />
        </Box>
        <Box
          component="main"
          aria-label="Chat workspace"
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
        >
          {error && (
            <Box sx={{ px: { xs: 2, sm: 3.5 }, pt: 2 }}>
              <Alert
                severity="error"
                onClose={() => setError('')}
                sx={{ width: '100%', maxWidth: chatMaxWidth, mx: 'auto' }}
              >
                {error}
              </Alert>
            </Box>
          )}
          {loadingMessages ? (
            <ChatMessagesSkeleton maxWidth={chatMaxWidth} />
          ) : (
            <MessageList
              messages={messages}
              sending={isStreamingActiveChat}
              streamingContent={isStreamingActiveChat ? streamingContent : ''}
              speakingId={speakingId}
              maxWidth={chatMaxWidth}
              scrollTrigger={scrollTrigger}
              onToggleSpeak={toggleSpeak}
              onSelectPrompt={(prompt) => void handleSend(prompt)}
              onQuoteSelection={(selected) => setQuotedText(selected)}
            />
          )}
          <ChatInput
            onSend={handleSend}
            maxWidth={chatMaxWidth}
            quotedText={quotedText}
            onClearQuote={() => setQuotedText('')}
            disabled={sending || loadingMessages}
          />
        </Box>
      </Box>
    </Box>
  );
};
