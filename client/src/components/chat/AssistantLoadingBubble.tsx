import { Avatar, Box, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';

const spin360 = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.45);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(139, 92, 246, 0);
  }
`;

export const AssistantLoadingBubble = () => {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label="Support AI is processing your request"
      sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}
    >
      <Avatar
        sx={{
          width: 34,
          height: 34,
          bgcolor: 'secondary.main',
          flexShrink: 0,
          animation: `${pulseGlow} 1.8s ease-in-out infinite`,
        }}
      >
        <AutoAwesomeRoundedIcon
          fontSize="small"
          sx={{ animation: `${spin360} 2.2s linear infinite` }}
        />
      </Avatar>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minWidth: 0,
          px: 2.25,
          py: 1.75,
          borderRadius: '12px',
          borderTopLeftRadius: '2px',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Stack spacing={1.1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85 }}>
            <AutoAwesomeRoundedIcon
              sx={{
                fontSize: 17,
                color: 'secondary.main',
                animation: `${spin360} 2s linear infinite`,
              }}
            />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Support AI is processing...
            </Typography>
          </Box>
          <Skeleton variant="rounded" animation="wave" height={12} width="96%" />
          <Skeleton variant="rounded" animation="wave" height={12} width="84%" />
          <Skeleton variant="rounded" animation="wave" height={12} width="58%" />
        </Stack>
      </Paper>
    </Box>
  );
};
