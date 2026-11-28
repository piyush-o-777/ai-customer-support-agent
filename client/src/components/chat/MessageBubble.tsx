import { useState } from 'react';
import { Avatar, Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import { useToast } from '../../context/ToastContext';
import { ChatMessage } from '../../types/chat.types';
import { MarkdownContent } from './MarkdownContent';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  isSpeaking?: boolean;
  onToggleSpeak?: (id: string, content: string) => void;
}

const blinkCursor = keyframes`
  0%, 49% {
    opacity: 1;
  }
  50%, 100% {
    opacity: 0;
  }
`;

const spin360 = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const MessageBubble = ({
  message,
  isStreaming = false,
  isSpeaking = false,
  onToggleSpeak,
}: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      showToast('Copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast('Failed to copy text', 'error');
    }
  };

  return (
    <Box
      component="article"
      aria-label={isUser ? 'Your message' : 'Support AI response'}
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1.5,
        width: '100%',
      }}
    >
      <Avatar
        aria-hidden="true"
        sx={{
          width: 34,
          height: 34,
          bgcolor: isUser ? 'primary.main' : 'secondary.main',
          flexShrink: 0,
        }}
      >
        {isUser ? (
          <PersonRoundedIcon fontSize="small" />
        ) : isStreaming ? (
          <AutoAwesomeRoundedIcon
            fontSize="small"
            sx={{ animation: `${spin360} 2s linear infinite` }}
          />
        ) : (
          <SmartToyRoundedIcon fontSize="small" />
        )}
      </Avatar>
      <Box
        sx={{
          flex: isUser ? undefined : 1,
          minWidth: 0,
          maxWidth: isUser ? { xs: '85%', sm: '70%' } : '100%',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            px: 2.25,
            py: 1.5,
            borderRadius: '12px',
            borderTopRightRadius: isUser ? '2px' : '12px',
            borderTopLeftRadius: isUser ? '12px' : '2px',
            bgcolor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            border: isUser ? 'none' : 1,
            borderColor: 'divider',
            wordBreak: 'break-word',
          }}
        >
          {isStreaming && !isUser && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
              <AutoAwesomeRoundedIcon
                aria-hidden="true"
                sx={{
                  fontSize: 16,
                  color: 'secondary.main',
                  animation: `${spin360} 2s linear infinite`,
                }}
              />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Support AI is writing...
              </Typography>
            </Box>
          )}
          {isUser ? (
            <Typography variant="body1" lineHeight={1.55} sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>
          ) : (
            <Box>
              <MarkdownContent content={message.content} />
              {isStreaming && (
                <Box
                  component="span"
                  aria-hidden="true"
                  sx={{
                    display: 'inline-block',
                    width: 7,
                    height: 16,
                    mt: 0.5,
                    borderRadius: '2px',
                    bgcolor: 'secondary.main',
                    animation: `${blinkCursor} 0.9s steps(1) infinite`,
                  }}
                />
              )}
            </Box>
          )}
        </Paper>
        {!isStreaming && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
              gap: 0.5,
              mt: 0.4,
              px: 0.5,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
              {formatTime(message.createdAt)}
            </Typography>
            <Tooltip title={copied ? 'Copied' : 'Copy text'}>
              <IconButton
                size="small"
                onClick={() => void handleCopy()}
                aria-label={isUser ? 'Copy your message' : 'Copy assistant response'}
                sx={{ color: copied ? 'success.main' : 'text.secondary', p: 0.4 }}
              >
                {copied ? (
                  <CheckRoundedIcon sx={{ fontSize: 15 }} />
                ) : (
                  <ContentCopyRoundedIcon sx={{ fontSize: 15 }} />
                )}
              </IconButton>
            </Tooltip>
            {onToggleSpeak && (
              <Tooltip title={isSpeaking ? 'Stop reading' : 'Read aloud'}>
                <IconButton
                  size="small"
                  onClick={() => onToggleSpeak(message.id, message.content)}
                  aria-label={isSpeaking ? 'Stop reading message aloud' : 'Read message aloud'}
                  aria-pressed={isSpeaking}
                  sx={{ color: isSpeaking ? 'primary.main' : 'text.secondary', p: 0.4 }}
                >
                  {isSpeaking ? (
                    <StopCircleOutlinedIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <VolumeUpRoundedIcon sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};
