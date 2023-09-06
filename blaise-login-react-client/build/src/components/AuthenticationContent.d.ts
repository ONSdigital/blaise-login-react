import { User } from 'blaise-api-node-client';
import React, { ReactElement } from 'react';
import AuthenticationApi from '../client/AuthenticationApi';
interface AuthenticationContentProps {
    authenticationApi: AuthenticationApi;
    children: (user: User) => React.ReactNode;
}
export default function AuthenticationContent({ authenticationApi, children }: AuthenticationContentProps): ReactElement;
export {};
