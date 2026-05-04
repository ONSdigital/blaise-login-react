import { LoadingPanel, Panel } from "blaise-design-system-react-components";
import { type AsyncState, hasErrored, isLoading } from "../hooks/useAsyncRequest";
import type { ReactNode } from "react";

interface AsyncContentProps<T> {
  content: AsyncState<T>;
  children: (data: T) => ReactNode;
}

export default function AsyncContent<T>({ content, children }: AsyncContentProps<T>): ReactNode {
  if (isLoading(content)) {
    return <LoadingPanel />;
  }

  if (hasErrored(content)) {
    return <Panel status="error">{content.error}</Panel>;
  }

  return children(content.data);
}
