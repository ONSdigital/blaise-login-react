import { AsyncState } from '../hooks/useAsyncRequest';
import React from 'react';
interface AsyncContentProps<T> {
    content: AsyncState<T>;
    children: (content: T) => React.ReactNode;
}
export default function AsyncContent<T>({ content, children }: AsyncContentProps<T>): React.JSX.Element;
export {};
