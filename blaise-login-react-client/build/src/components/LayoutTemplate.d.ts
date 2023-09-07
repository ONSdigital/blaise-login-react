import React from 'react';
interface LayoutTemplateProps {
    title: string;
    children: React.ReactNode;
}
export default function LayoutTemplate({ title, children }: LayoutTemplateProps): React.JSX.Element;
export {};
