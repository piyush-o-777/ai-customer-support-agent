import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { keyframes } from '@mui/system';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import { useToast } from '../../context/ToastContext';
import { useVoiceToText } from '../../hooks/useVoiceToText';

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  maxWidth: number | string;
  quotedText: string;
  onClearQuote: () => void;
  disabled?: boolean;
}

const micPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
`;

export const ChatInput = ({
  onSend,
  maxWidth,
  quotedText,
  onClearQuote,
  disabled = false,
}: ChatInputProps) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (quotedText) {
      inputRef.current?.focus();
    }
  }, [quotedText]);

  const { listening, toggleListening, stopListening } = useVoiceToText({
    onTranscript: (spoken) => {
      setValue((prev) => (prev.trim() ? `${prev.trim()} ${spoken}` : spoken));
    },
    onError: (message) => {
      showToast(message, 'warning');
    },
  });

  const submitMessage = async () => {
    const trimmed = value.trim();
    if ((!trimmed && !quotedText) || disabled) {
      return;
    }
    if (listening) {
      stopListening();
    }
    const finalMessage = quotedText
      ? trimmed
        ? `Regarding: "${quotedText}"\n\n${trimmed}`
        : `Please explain this: "${quotedText}"`
      : trimmed;
    setValue('');
    onClearQuote();
    await onSend(finalMessage);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitMessage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submitMessage();
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        px: { xs: 2, sm: 3 },
        py: 2,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth,
          mx: 'auto',
          transition: 'max-width 0.25s ease',
        }}
      >
        {quotedText && (
          <Paper
            elevation={0}
            sx={{
              mb: 1,
              px: 1.5,
              py: 1,
              borderRadius: '8px',
              border: 1,
              borderColor: 'primary.main',
              borderLeftWidth: 3,
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <FormatQuoteRoundedIcon fontSize="small" color="primary" sx={{ flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {quotedText}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={onClearQuote}
              aria-label="Remove quoted text"
              sx={{ p: 0.25 }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Paper>
        )}
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            p: 1,
            border: 1,
            borderColor: listening ? 'error.main' : 'divider',
            borderRadius: '10px',
            bgcolor: 'background.default',
            transition: 'border-color 0.2s ease',
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={5}
            inputRef={inputRef}
            placeholder={
              listening
                ? 'Listening... speak now'
                : quotedText
                  ? 'Ask your follow-up question about the selected text...'
                  : 'Type your message... (Enter to send, Shift+Enter for new line)'
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            sx={{ px: 1.25, py: 0.5 }}
          />
          <Tooltip title={listening ? 'Stop voice input' : 'Voice to text'}>
            <span>
              <IconButton
                type="button"
                onClick={toggleListening}
                disabled={disabled}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                sx={{
                  bgcolor: listening ? 'error.main' : 'action.hover',
                  color: listening ? '#ffffff' : 'text.primary',
                  animation: listening ? `${micPulse} 1.4s ease-in-out infinite` : 'none',
                  '&:hover': {
                    bgcolor: listening ? 'error.dark' : 'action.selected',
                  },
                }}
              >
                {listening ? (
                  <StopRoundedIcon fontSize="small" />
                ) : (
                  <MicRoundedIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <IconButton
            type="submit"
            color="primary"
            disabled={disabled || (!value.trim() && !quotedText)}
            aria-label="Send message"
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled',
              },
            }}
          >
            {disabled ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SendRoundedIcon fontSize="small" />
            )}
          </IconButton>
        </Paper>
      </Box>
    </Box>
  );
};
