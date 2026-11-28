import { Box, Skeleton, Stack } from '@mui/material';

interface ConversationListSkeletonProps {
  count?: number;
}

export const ConversationListSkeleton = ({ count = 5 }: ConversationListSkeletonProps) => {
  return (
    <Stack spacing={1} sx={{ px: 1, py: 0.5 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            px: 1.25,
            py: 1,
            borderRadius: '8px',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Skeleton
            variant="rounded"
            animation="wave"
            height={14}
            width={index % 2 === 0 ? '82%' : '68%'}
            sx={{ mb: 0.75 }}
          />
          <Skeleton variant="rounded" animation="wave" height={10} width="38%" />
        </Box>
      ))}
    </Stack>
  );
};
