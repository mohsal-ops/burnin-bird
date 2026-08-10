import { GenericSkeleton } from "./_components/AdminSkeletons";

// Fallback loading UI for every admin page without its own loading.tsx.
// Skeleton only - the burger plays once on login (see admin/layout.tsx).
export default function AdminLoading() {
  return <GenericSkeleton />;
}
