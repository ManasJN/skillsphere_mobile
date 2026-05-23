/**
 * app-ui.tsx — re-exports from ui.tsx for backward compatibility.
 * All components now live in ui.tsx. This file exists only so that
 * any legacy import of './app-ui' still resolves cleanly.
 */
export {
  Button, Card, Badge, Avatar, EmptyState, SectionHeader,
  Skeleton, SkeletonCard, ProgressBar, Row, Divider,
  StatChip, StatTile, GoalItem, ErrorBanner,
  type BadgeColor,
} from './ui';
