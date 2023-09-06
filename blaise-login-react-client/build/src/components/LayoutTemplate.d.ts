import React from 'react';
interface LayoutTemplateProps {
    children: React.ReactNode;
    showSignOutButton: boolean;
    signOut: () => void;
}
export default function LayoutTemplate({ children, showSignOutButton, signOut }: LayoutTemplateProps): React.JSX.Element;
export {};
