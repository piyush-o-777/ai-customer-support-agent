import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import AddCommentRoundedIcon from '@mui/icons-material/AddCommentRounded';
import CropFreeRoundedIcon from '@mui/icons-material/CropFreeRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SmartphoneRoundedIcon from '@mui/icons-material/SmartphoneRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import TabletMacRoundedIcon from '@mui/icons-material/TabletMacRounded';
import { User } from '../../types/auth.types';
import { ChatWidthMode } from '../../types/chat.types';
import { ThemeToggleButton } from '../common/ThemeToggleButton';

interface TopBarProps {
  user: User | null;
  chatWidth: ChatWidthMode;
  onChangeChatWidth: (mode: ChatWidthMode) => void;
  onNewChat: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
  disableNewChat?: boolean;
}

export const TopBar = ({
  user,
  chatWidth,
  onChangeChatWidth,
  onNewChat,
  onLogout,
  onToggleSidebar,
  disableNewChat = false,
}: TopBarProps) => {
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="default"
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ gap: 1.5, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onToggleSidebar}
            aria-label="Open chat history"
            sx={{ display: { md: 'none' } }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34 }}>
            <SupportAgentRoundedIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              Support AI
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              Customer Support Assistant
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={chatWidth}
            onChange={(_e, next: ChatWidthMode | null) => {
              if (next) {
                onChangeChatWidth(next);
              }
            }}
            aria-label="Chat display width"
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            <ToggleButton value="full" aria-label="Full width">
              <Tooltip title="Full width">
                <CropFreeRoundedIcon sx={{ fontSize: 18 }} />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="medium" aria-label="Medium width">
              <Tooltip title="Medium width">
                <TabletMacRoundedIcon sx={{ fontSize: 18 }} />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="mobile" aria-label="Mobile width">
              <Tooltip title="Mobile width">
                <SmartphoneRoundedIcon sx={{ fontSize: 18 }} />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddCommentRoundedIcon fontSize="small" />}
            onClick={onNewChat}
            disabled={disableNewChat}
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          >
            New
          </Button>
          <ThemeToggleButton />
          {user && (
            <Chip
              avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}>{initials}</Avatar>}
              label={user.name}
              variant="outlined"
              sx={{ display: { xs: 'none', lg: 'inline-flex' } }}
            />
          )}
          <Button
            variant="text"
            color="inherit"
            size="small"
            startIcon={<LogoutRoundedIcon fontSize="small" />}
            onClick={onLogout}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
