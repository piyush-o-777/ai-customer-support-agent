import { Avatar, Box, Typography } from '@mui/material';

const DEFAULT_CREATOR_NAME = 'Developed by Piyush Ohri';
const DEFAULT_CREATOR_EMAIL = 'ohri.piyush0190@gmail.com';

interface CreatorBadgeProps {
  label?: string;
  email?: string;
}

export const CreatorBadge = ({
  label = DEFAULT_CREATOR_NAME,
  email = DEFAULT_CREATOR_EMAIL,
}: CreatorBadgeProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1.5,
        px: 2,
      }}
    >
      <Avatar
        src="/creator-avatar.jpg"
        alt={label}
        sx={{
          width: 42,
          height: 42,
          flexShrink: 0,
          border: 2,
          borderColor: 'primary.main',
          boxShadow: 1,
        }}
      />
      <Box sx={{ minWidth: 0, textAlign: 'left' }}>
        <Typography variant="body2" fontWeight={700} noWrap lineHeight={1.25}>
          {label}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ display: 'block', fontWeight: 500 }}
        >
          {email}
        </Typography>
      </Box>
    </Box>
  );
};
