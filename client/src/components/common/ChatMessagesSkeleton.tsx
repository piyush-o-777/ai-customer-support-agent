import { Box, Paper, Skeleton, Stack } from '@mui/material';

const ROWS = [
  { isUser: true, lines: ['78%'] },
  { isUser: false, lines: ['95%', '88%', '62%'] },
  { isUser: true, lines: ['64%'] },
  { isUser: false, lines: ['92%', '74%'] },
];

export const ChatMessagesSkeleton = ({ maxWidth = '100%' }: { maxWidth?: number | string }) => {
  return (
    <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3.5 }, py: 3 }}>
      <Stack
        spacing={2.5}
        sx={{ width: '100%', maxWidth, mx: 'auto', transition: 'max-width 0.25s ease' }}
      >
        {ROWS.map((row, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              flexDirection: row.isUser ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
              gap: 1.5,
              width: '100%',
            }}
          >
            <Skeleton variant="circular" animation="wave" width={34} height={34} sx={{ flexShrink: 0 }} />
            <Paper
              elevation={0}
              sx={{
                flex: row.isUser ? undefined : 1,
                width: row.isUser ? { xs: '76%', sm: 320 } : undefined,
                minWidth: 0,
                px: 2.25,
                py: 1.5,
                borderRadius: '12px',
                borderTopRightRadius: row.isUser ? '2px' : '12px',
                borderTopLeftRadius: row.isUser ? '12px' : '2px',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Stack spacing={0.9}>
                {row.lines.map((w, i) => (
                  <Skeleton key={i} variant="rounded" animation="wave" height={12} width={w} />
                ))}
              </Stack>
            </Paper>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
