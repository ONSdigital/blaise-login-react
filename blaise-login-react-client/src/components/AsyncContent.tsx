import { ONSLoadingPanel, ONSPanel } from "blaise-design-system-react-components";
import { type AsyncState, hasErrored, isLoading } from "../hooks/useAsyncRequest";
import type { ReactNode } from "react";

interface AsyncContentProps<T> {
  content: AsyncState<T>;
  children: (data: T) => ReactNode;
}

export default function AsyncContent<T>({ content, children }: AsyncContentProps<T>): ReactNode {
  if (isLoading(content)) {
    return <ONSLoadingPanel />;
  }

  if (hasErrored(content)) {
    return <ONSPanel status="error">{content.error}</ONSPanel>;
  }

  return children(content.data);
}
