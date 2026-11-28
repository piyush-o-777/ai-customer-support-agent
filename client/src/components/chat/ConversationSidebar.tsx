import { MouseEvent, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddCommentRoundedIcon from '@mui/icons-material/AddCommentRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Conversation } from '../../types/chat.types';
import { ConversationListSkeleton } from '../common/ConversationListSkeleton';
import { CreatorBadge } from '../common/CreatorBadge';

export const SIDEBAR_WIDTH = 292;

type DateFilter = 'all' | 'today' | '7d' | '30d';

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
];

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  deletingId: string | null;
  bulkDeleting: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelect: (conversationId: string) => void;
  onNewChat: () => void;
  onDelete: (conversationId: string) => void;
  onBulkDelete: (conversationIds: string[]) => Promise<void>;
  disableActions?: boolean;
}

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const matchesDateFilter = (iso: string, filter: DateFilter): boolean => {
  if (filter === 'all') {
    return true;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  const now = new Date();
  if (filter === 'today') {
    return date.toDateString() === now.toDateString();
  }
  const diffMs = now.getTime() - date.getTime();
  const days = filter === '7d' ? 7 : 30;
  return diffMs <= days * 24 * 60 * 60 * 1000;
};

export const ConversationSidebar = ({
  conversations,
  activeId,
  loading,
  deletingId,
  bulkDeleting,
  mobileOpen,
  onCloseMobile,
  onSelect,
  onNewChat,
  onDelete,
  onBulkDelete,
  disableActions = false,
}: ConversationSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return conversations.filter((conv) => {
      const matchesQuery = !query || conv.title.toLowerCase().includes(query);
      return matchesQuery && matchesDateFilter(conv.updatedAt, dateFilter);
    });
  }, [conversations, searchQuery, dateFilter]);

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedIds([]);
  };

  const toggleItemSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allFilteredSelected =
    filteredConversations.length > 0 &&
    filteredConversations.every((conv) => selectedIds.includes(conv.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredConversations.map((conv) => conv.id));
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) {
      return;
    }
    await onBulkDelete(selectedIds);
    setSelectedIds([]);
    setSelectionMode(false);
  };

  const handleDeleteClick = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
  };

  const content = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ p: 2, pb: 1.5 }}>
        <Stack spacing={1.25}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddCommentRoundedIcon fontSize="small" />}
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            disabled={disableActions || bulkDeleting}
          >
            New Chat
          </Button>
          <TextField
            size="small"
            fullWidth
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="clear search"
                    onClick={() => setSearchQuery('')}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
          <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
            {DATE_FILTER_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                size="small"
                clickable
                color={dateFilter === opt.value ? 'primary' : 'default'}
                variant={dateFilter === opt.value ? 'filled' : 'outlined'}
                onClick={() => setDateFilter(opt.value)}
                sx={{ borderRadius: '8px', fontSize: '0.74rem' }}
              />
            ))}
          </Box>
        </Stack>
      </Box>
      <Divider />
      <Box
        sx={{
          px: 2,
          pt: 1.25,
          pb: 0.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="overline" color="text.secondary" fontWeight={700}>
          Chat History ({filteredConversations.length})
        </Typography>
        <Tooltip title={selectionMode ? 'Cancel selection' : 'Select chats'}>
          <span>
            <IconButton
              size="small"
              color={selectionMode ? 'primary' : 'default'}
              onClick={toggleSelectionMode}
              disabled={conversations.length === 0 || disableActions || bulkDeleting}
              aria-label="toggle selection mode"
            >
              {selectionMode ? (
                <CloseRoundedIcon fontSize="small" />
              ) : (
                <ChecklistRoundedIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      {selectionMode && (
        <Box
          sx={{
            px: 1.5,
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Button size="small" variant="text" onClick={handleToggleSelectAll}>
            {allFilteredSelected ? 'Clear' : 'Select All'}
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            disabled={selectedIds.length === 0 || bulkDeleting}
            onClick={() => void handleConfirmBulkDelete()}
          >
            {bulkDeleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
          </Button>
        </Box>
      )}
      <Box
        sx={(theme) => {
          const isDark = theme.palette.mode === 'dark';
          const thumbColor = isDark ? 'rgba(148, 163, 184, 0.24)' : 'rgba(100, 116, 139, 0.26)';
          const thumbHover = isDark ? 'rgba(96, 165, 250, 0.5)' : 'rgba(37, 99, 235, 0.45)';
          return {
            flex: 1,
            overflowY: 'auto',
            px: 1,
            pb: 2,
            scrollbarWidth: 'thin',
            scrollbarColor: `${thumbColor} transparent`,
            '&::-webkit-scrollbar': {
              width: '5px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: thumbColor,
              borderRadius: '999px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: thumbHover,
            },
          };
        }}
      >
        {loading ? (
          <ConversationListSkeleton count={5} />
        ) : filteredConversations.length === 0 ? (
          <Box sx={{ textAlign: 'center', px: 2, py: 4 }}>
            <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 28, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {conversations.length === 0 ? 'No conversations yet' : 'No matching chats'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {filteredConversations.map((conv) => {
              const selected = selectionMode
                ? selectedIds.includes(conv.id)
                : conv.id === activeId;
              const isDeleting = deletingId === conv.id;
              return (
                <ListItemButton
                  key={conv.id}
                  selected={selected}
                  onClick={() => {
                    if (selectionMode) {
                      toggleItemSelected(conv.id);
                    } else {
                      onSelect(conv.id);
                      onCloseMobile();
                    }
                  }}
                  sx={{
                    borderRadius: '8px',
                    px: selectionMode ? 0.75 : 1.5,
                    pr: 1,
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  {selectionMode && (
                    <Checkbox
                      size="small"
                      checked={selectedIds.includes(conv.id)}
                      sx={{ p: 0.5, mr: 0.75 }}
                    />
                  )}
                  <ListItemText
                    primary={conv.title}
                    secondary={formatDate(conv.updatedAt)}
                    primaryTypographyProps={{
                      noWrap: true,
                      variant: 'body2',
                      fontWeight: selected ? 600 : 500,
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                    }}
                  />
                  {!selectionMode && (
                    <Tooltip title="Delete conversation">
                      <span>
                        <IconButton
                          size="small"
                          edge="end"
                          aria-label="delete conversation"
                          disabled={isDeleting || disableActions}
                          onClick={(e) => handleDeleteClick(e, conv.id)}
                        >
                          {isDeleting ? (
                            <CircularProgress size={16} />
                          ) : (
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
      <Divider />
      <CreatorBadge />
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onCloseMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            position: 'relative',
            height: '100%',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        {content}
      </Drawer>
    </>
  );
};
