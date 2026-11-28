import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent = ({ content }: MarkdownContentProps) => {
  return (
    <Box
      sx={(theme) => {
        const isDark = theme.palette.mode === 'dark';
        const codeBg = isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(15, 23, 42, 0.06)';
        const borderCol = theme.palette.divider;
        return {
          fontSize: '0.96rem',
          lineHeight: 1.65,
          wordBreak: 'break-word',
          '& p': {
            margin: '0 0 0.75em 0',
          },
          '& p:last-child': {
            marginBottom: 0,
          },
          '& h1, & h2, & h3, & h4': {
            margin: '1em 0 0.5em 0',
            fontWeight: 700,
            lineHeight: 1.3,
          },
          '& h1:first-of-type, & h2:first-of-type, & h3:first-of-type': {
            marginTop: 0,
          },
          '& ul, & ol': {
            margin: '0.5em 0 0.85em 0',
            paddingLeft: '1.5em',
          },
          '& li': {
            marginBottom: '0.35em',
          },
          '& li:last-child': {
            marginBottom: 0,
          },
          '& strong': {
            fontWeight: 700,
          },
          '& a': {
            color: theme.palette.primary.main,
            textDecoration: 'underline',
          },
          '& code': {
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: '0.88em',
            backgroundColor: codeBg,
            padding: '2px 6px',
            borderRadius: '5px',
          },
          '& pre': {
            margin: '0.75em 0',
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: codeBg,
            border: `1px solid ${borderCol}`,
            overflowX: 'auto',
          },
          '& pre code': {
            backgroundColor: 'transparent',
            padding: 0,
            borderRadius: 0,
          },
          '& blockquote': {
            margin: '0.75em 0',
            paddingLeft: '12px',
            borderLeft: `3px solid ${theme.palette.primary.main}`,
            color: theme.palette.text.secondary,
          },
          '& table': {
            width: '100%',
            borderCollapse: 'collapse',
            margin: '0.75em 0',
            fontSize: '0.9em',
          },
          '& th, & td': {
            border: `1px solid ${borderCol}`,
            padding: '6px 10px',
            textAlign: 'left',
          },
          '& th': {
            backgroundColor: codeBg,
            fontWeight: 600,
          },
        };
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};
