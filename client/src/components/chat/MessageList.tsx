import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Fab,
  Paper,
  Stack,
  Tooltip,
  Typography,
  Zoom,
} from '@mui/material';
import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import { ChatMessage } from '../../types/chat.types';
import { AssistantLoadingBubble } from './AssistantLoadingBubble';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  sending: boolean;
  streamingContent: string;
  speakingId: string | null;
  maxWidth: number | string;
  scrollTrigger: number;
  onToggleSpeak: (id: string, content: string) => void;
  onSelectPrompt: (prompt: string) => void;
  onQuoteSelection: (selectedText: string) => void;
}

interface SelectionPopoverState {
  text: string;
  top: number;
  left: number;
}

const STARTER_PROMPTS = [
  'How do I request a refund?',
  'Where is my recent order?',
  'How can I update my billing email?',
  'My item arrived damaged, what should I do?',
];

export const MessageList = ({
  messages,
  sending,
  streamingContent,
  speakingId,
  maxWidth,
  scrollTrigger,
  onToggleSpeak,
  onSelectPrompt,
  onQuoteSelection,
}: MessageListProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [selectionPopover, setSelectionPopover] = useState<SelectionPopoverState | null>(null);

  const checkScrollPosition = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) {
      return;
    }
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distanceFromBottom > 120);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
    } else {
      bottomRef.current?.scrollIntoView({ behavior });
    }
    setShowScrollDown(false);
  }, []);

  useEffect(() => {
    if (scrollTrigger > 0) {
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    }
  }, [scrollTrigger, scrollToBottom]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) {
      return;
    }
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 260) {
      scrollToBottom('auto');
    } else {
      checkScrollPosition();
    }
  }, [messages, sending, streamingContent, scrollToBottom, checkScrollPosition]);

  const updateSelectionPopover = useCallback(() => {
    const selection = window.getSelection();
    const container = scrollContainerRef.current;
    const wrapper = wrapperRef.current;
    if (!selection || selection.isCollapsed || !container || !wrapper) {
      setSelectionPopover(null);
      return;
    }
    const text = selection.toString().trim();
    if (!text) {
      setSelectionPopover(null);
      return;
    }
    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    if (!anchorNode || !focusNode || !container.contains(anchorNode) || !container.contains(focusNode)) {
      setSelectionPopover(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const top = Math.max(8, rect.top - wrapperRect.top - 42);
    const rawLeft = rect.left - wrapperRect.left + rect.width / 2;
    const left = Math.min(Math.max(90, rawLeft), Math.max(90, wrapperRect.width - 90));
    setSelectionPopover({ text, top, left });
  }, []);

  useEffect(() => {
    const onSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setSelectionPopover(null);
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  const handleAskSelection = () => {
    if (!selectionPopover) {
      return;
    }
    onQuoteSelection(selectionPopover.text);
    setSelectionPopover(null);
    window.getSelection()?.removeAllRanges();
  };

  if (messages.length === 0 && !sending) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: 580,
            width: '100%',
            p: { xs: 3, sm: 4 },
            textAlign: 'center',
            border: 1,
            borderColor: 'divider',
            borderRadius: '12px',
          }}
        >
          <Avatar
            aria-hidden="true"
            sx={{
              width: 52,
              height: 52,
              bgcolor: 'primary.main',
              mx: 'auto',
              mb: 2,
            }}
          >
            <SupportAgentRoundedIcon />
          </Avatar>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            How can I help you today?
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Ask anything about orders, refunds, billing, or troubleshooting.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {STARTER_PROMPTS.map((prompt) => (
              <Chip
                key={prompt}
                label={prompt}
                onClick={() => onSelectPrompt(prompt)}
                variant="outlined"
                clickable
                sx={{ py: 0.5 }}
              />
            ))}
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      ref={wrapperRef}
      sx={{ flex: 1, position: 'relative', minHeight: 0, display: 'flex' }}
    >
      <Box
        ref={scrollContainerRef}
        onScroll={() => {
          checkScrollPosition();
          setSelectionPopover(null);
        }}
        onMouseUp={updateSelectionPopover}
        onKeyUp={updateSelectionPopover}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Chat messages"
        sx={(theme) => {
          const isDark = theme.palette.mode === 'dark';
          const thumbColor = isDark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(100, 116, 139, 0.3)';
          const thumbHover = isDark ? 'rgba(96, 165, 250, 0.55)' : 'rgba(37, 99, 235, 0.5)';
          return {
            flex: 1,
            overflowY: 'auto',
            px: { xs: 2, sm: 3.5 },
            py: 3,
            scrollbarWidth: 'thin',
            scrollbarColor: `${thumbColor} transparent`,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: thumbColor,
              borderRadius: '999px',
              transition: 'background-color 0.2s ease',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: thumbHover,
            },
          };
        }}
      >
        <Stack
          spacing={2.5}
          sx={{
            width: '100%',
            maxWidth,
            mx: 'auto',
            transition: 'max-width 0.25s ease',
          }}
        >
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSpeaking={speakingId === msg.id}
              onToggleSpeak={onToggleSpeak}
            />
          ))}
          {sending && !streamingContent && <AssistantLoadingBubble />}
          {sending && streamingContent && (
            <MessageBubble
              message={{
                id: 'streaming-assistant',
                conversationId: 'streaming',
                role: 'assistant',
                content: streamingContent,
                createdAt: new Date().toISOString(),
              }}
              isStreaming
            />
          )}
          <div ref={bottomRef} />
        </Stack>
      </Box>
      {selectionPopover && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: selectionPopover.top,
            left: selectionPopover.left,
            transform: 'translateX(-50%)',
            zIndex: 10,
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <Button
            size="small"
            variant="contained"
            startIcon={<FormatQuoteRoundedIcon fontSize="small" />}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleAskSelection}
            aria-label="Insert selected text and ask"
            sx={{ px: 1.5, py: 0.6, fontSize: '0.78rem', whiteSpace: 'nowrap' }}
          >
            Ask Support AI
          </Button>
        </Paper>
      )}
      <Zoom in={showScrollDown}>
        <Tooltip title="Scroll to bottom">
          <Fab
            size="small"
            color="primary"
            aria-label="Scroll to latest message"
            onClick={() => scrollToBottom('smooth')}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 24,
              boxShadow: 3,
            }}
          >
            <KeyboardArrowDownRoundedIcon />
          </Fab>
        </Tooltip>
      </Zoom>
    </Box>
  );
};
